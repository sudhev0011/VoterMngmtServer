const express = require('express');
const router = express.Router();
const Voter = require('../models/Voter');
const { auth, isAdmin } = require('../middleware/auth');

// Get all voters with sorting support (public access)
router.get('/', async (req, res) => {
  try {
    const { sortBy = 'serialNo', sortOrder = 'asc' } = req.query;
    
    // Validate sortBy field
    const allowedSortFields = ['serialNo', 'name', 'guardianName', 'houseNo', 'houseName', 'genderAge', 'idCardNo'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'serialNo';
    
    // Validate sortOrder
    const validSortOrder = sortOrder === 'desc' ? -1 : 1;
    
    // Create sort object
    const sortObject = { [validSortBy]: validSortOrder };
    
    const voters = await Voter.find().sort(sortObject);
    res.json(voters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create voter (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  const voter = new Voter({
    serialNo: req.body.serialNo,
    name: req.body.name,
    guardianName: req.body.guardianName,
    houseNo: req.body.houseNo,
    houseName: req.body.houseName,
    genderAge: req.body.genderAge,
    idCardNo: req.body.idCardNo
  });
  try {
    const newVoter = await voter.save();
    res.status(201).json(newVoter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update voter (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id);
    if (voter == null) return res.status(404).json({ message: 'Voter not found' });

    Object.assign(voter, req.body);
    const updatedVoter = await voter.save();
    res.json(updatedVoter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete voter (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id);
    if (voter == null) return res.status(404).json({ message: 'Voter not found' });
    
    await voter.remove();
    res.json({ message: 'Voter deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;