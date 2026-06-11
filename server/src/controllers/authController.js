const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');

function createToken(user) {
  return jwt.sign({ role: user.role }, jwtSecret, {
    expiresIn: jwtExpiresIn,
    subject: String(user._id)
  });
}

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, batch } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, 'Full name, email, and password are required');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'User already exists');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    fullName,
    email,
    passwordHash,
    role: 'student',
    batch: batch || 'General'
  });

  const token = createToken(user);
  res.status(201).json({ token, user: user.toSafeJSON() });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid credentials');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = createToken(user);
  res.json({ token, user: user.toSafeJSON() });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

module.exports = { register, login, me };
