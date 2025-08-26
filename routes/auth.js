const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const generateToken = require('../utils/jwt');
const setCookie = require('../utils/setCookie');
const {OAuth2Client} = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

//register
router.post('/register', async(req,res)=>{
  const {username, password, confirmPassword} = req.body;

  if(!username.trim() || !password.trim()) return res.status(400).json({message: 'No Valid username or password found'});
  if(password?.trim() !== confirmPassword?.trim()) return res.status(400).json({message: 'The passwords doesnt match'})

  try {
    const existingUser = await User.findOne({username});
    if(existingUser) return res.status(409).json({message: 'user already exit please try login'});
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({username, password: hashedPassword, role: 'user'});
    await user.save();

    res.status(201).json({message: 'User registered successfully'});
  } catch (error) {
    res.status(400).json({message: err.message})
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = await generateToken({ userId: user._id, role: user.role });
    setCookie(token,res);

    res.json({ role: user.role, userId: user._id, isAuthenticated: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

//GoogleAuth
router.post('/google', async(req, res)=>{
  const {token} = req.body
  try {
    if(token){
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      let user = await User.findOne({username: payload.email});

      if(!user){
        user = await User.create({
          username: payload.email,
          role: 'user'
        })
      }

      const jwtToken = generateToken({userId: user._id, role: user.role})
      setCookie(jwtToken, res);
      res.status(200).json({userId: user._id, role: user.role, isAuthenticated: true})
    }else{
      res.status(400).json({success:false, message: 'Token not found'});
    }

  } catch (error) {
    res.status(400).json({message: error.message});
  }
})

// Check auth
router.get('/check', auth, async (req, res) => {
  try {
    res.json({ role: req.user.role, userId: req.user.userId, isAuthenticated: true });
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// Logout
router.post('/logout', (req,res) => {
  res.clearCookie('token',{
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
  res.json({ message: 'Logged out' });
});

module.exports = router;