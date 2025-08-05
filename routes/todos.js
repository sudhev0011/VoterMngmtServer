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

// POST /api/todos - Add a voter to the user's todo list
router.post('/todos', auth, async (req, res) => {
  try {
    const { voterId } = req.body;

    if (!voterId) {
      return res.status(400).json({ message: 'Voter ID is required' });
    }

    // Check if voter exists
    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    // Check if todo already exists for this user and voter
    const existingTodo = await Todo.findOne({
      userId: req.user.userId,
      voterId: voterId
    });

    if (existingTodo) {
      return res.status(400).json({ message: 'Voter already in your todo list' });
    }

    // Create new todo
    const todo = new Todo({
      userId: req.user.userId,
      voterId: voterId,
      hasVoted: false
    });

    await todo.save();

    // Populate the voter data before sending response
    await todo.populate({
      path: 'voterId',
      select: 'serialNo name guardianName houseNo houseName genderAge idCardNo'
    });

    res.status(201).json(todo);
  } catch (error) {
    console.error('Error adding todo:', error);
    
    // Handle duplicate key error (in case the unique index constraint is violated)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Voter already in your todo list' });
    }
    
    res.status(500).json({ message: 'Server error while adding voter to todo list' });
  }
});

// PUT /api/todos/:id - Update voting status for a todo item
router.put('/todos/:id', auth, async (req, res) => {
  try {
    const { hasVoted } = req.body;
    const todoId = req.params.id;

    if (typeof hasVoted !== 'boolean') {
      return res.status(400).json({ message: 'hasVoted must be a boolean value' });
    }

    // Find and update the todo, ensuring it belongs to the authenticated user
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

// DELETE /api/todos/:id - Remove a voter from the user's todo list
router.delete('/todos/:id', auth, async (req, res) => {
  try {
    const todoId = req.params.id;

    // Find and delete the todo, ensuring it belongs to the authenticated user
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

// GET /api/todos/stats - Get todo statistics for the user
router.get('/todos/stats', auth, async (req, res) => {
  try {
    const stats = await Todo.aggregate([
      { $match: { userId: req.user.userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          voted: { $sum: { $cond: ['$hasVoted', 1, 0] } },
          pending: { $sum: { $cond: ['$hasVoted', 0, 1] } }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : { total: 0, voted: 0, pending: 0 };
    delete result._id;

    res.json(result);
  } catch (error) {
    console.error('Error fetching todo stats:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

// PATCH /api/todos/bulk-update - Bulk update voting status for multiple todos
router.patch('/todos/bulk-update', auth, async (req, res) => {
  try {
    const { todoIds, hasVoted } = req.body;

    if (!Array.isArray(todoIds) || todoIds.length === 0) {
      return res.status(400).json({ message: 'todoIds must be a non-empty array' });
    }

    if (typeof hasVoted !== 'boolean') {
      return res.status(400).json({ message: 'hasVoted must be a boolean value' });
    }

    // Update multiple todos at once
    const result = await Todo.updateMany(
      { 
        _id: { $in: todoIds }, 
        userId: req.user.userId 
      },
      { 
        hasVoted: hasVoted,
        updatedAt: new Date()
      }
    );

    res.json({
      message: `Successfully updated ${result.modifiedCount} todo items`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating todos:', error);
    res.status(500).json({ message: 'Server error while bulk updating todos' });
  }
});

module.exports = router;