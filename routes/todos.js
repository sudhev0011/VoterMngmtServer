const express = require('express');
const router = express.Router();
const Todo = require('../models/Todos');
const Voter = require('../models/Voter');
const { auth } = require('../middleware/auth');

router.get('/todos', auth, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.userId })
      .populate({
        path: 'voterId',
        select: 'serialNo name guardianName houseNo houseName genderAge idCardNo'
      })
      .sort({ createdAt: -1 });

    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Server error while fetching todos' });
  }
});

router.post('/todos', auth, async (req, res) => {
  try {
    const { voterId } = req.body;

    if (!voterId) {
      return res.status(400).json({ message: 'Voter ID is required' });
    }

    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    const existingTodo = await Todo.findOne({
      userId: req.user.userId,
      voterId: voterId
    });

    if (existingTodo) {
      return res.status(400).json({ message: 'Voter already in your todo list' });
    }

    const todo = new Todo({
      userId: req.user.userId,
      voterId: voterId,
      hasVoted: false
    });

    await todo.save();

    await todo.populate({
      path: 'voterId',
      select: 'serialNo name guardianName houseNo houseName genderAge idCardNo'
    });

    res.status(201).json(todo);
  } catch (error) {
    console.error('Error adding todo:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Voter already in your todo list' });
    }
    
    res.status(500).json({ message: 'Server error while adding voter to todo list' });
  }
});

router.put('/todos/:id', auth, async (req, res) => {
  try {
    const { hasVoted } = req.body;
    const todoId = req.params.id;

    if (typeof hasVoted !== 'boolean') {
      return res.status(400).json({ message: 'hasVoted must be a boolean value' });
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: todoId, userId: req.user.userId },
      { 
        hasVoted: hasVoted,
        updatedAt: new Date()
      },
      { new: true }
    ).populate({
      path: 'voterId',
      select: 'serialNo name guardianName houseNo houseName genderAge idCardNo'
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo item not found' });
    }

    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ message: 'Server error while updating voting status' });
  }
});

router.delete('/todos/:id', auth, async (req, res) => {
  try {
    const todoId = req.params.id;

    const todo = await Todo.findOneAndDelete({
      _id: todoId,
      userId: req.user.userId
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo item not found' });
    }

    res.json({ message: 'Voter removed from todo list successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: 'Server error while removing voter from todo list' });
  }
});

module.exports = router;