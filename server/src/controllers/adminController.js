const User = require('../models/User');
const Question = require('../models/Question');
const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');
const AiInteraction = require('../models/AiInteraction');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');

const dashboard = asyncHandler(async (req, res) => {
  const [totalStudents, totalAssessments, totalQuestions, totalSubmissions, averageScoreAgg, aiUsageAgg] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Assessment.countDocuments(),
    Question.countDocuments(),
    Submission.countDocuments(),
    Submission.aggregate([{ $group: { _id: null, avgScore: { $avg: '$score' } } }]),
    AiInteraction.countDocuments()
  ]);

  res.json({
    stats: {
      totalStudents,
      totalAssessments,
      totalQuestions,
      totalSubmissions,
      averageScore: Math.round((averageScoreAgg[0]?.avgScore || 0) * 100) / 100,
      aiMentorRequests: aiUsageAgg
    }
  });
});

const listStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });
  res.json({ students: students.map((student) => student.toSafeJSON()) });
});

const createStudent = asyncHandler(async (req, res) => {
  const { fullName, email, password, batch } = req.body;
  if (!fullName || !email || !password) {
    throw new ApiError(400, 'fullName, email, and password are required');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'User already exists');
  }

  const user = await User.create({
    fullName,
    email,
    passwordHash: await User.hashPassword(password),
    role: 'student',
    batch: batch || 'General'
  });

  res.status(201).json({ user: user.toSafeJSON() });
});

const updateStudent = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!user) {
    throw new ApiError(404, 'Student not found');
  }
  res.json({ user: user.toSafeJSON() });
});

const deleteStudent = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new ApiError(404, 'Student not found');
  }
  res.json({ message: 'Student deleted' });
});

module.exports = { dashboard, listStudents, createStudent, updateStudent, deleteStudent };
