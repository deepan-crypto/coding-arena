const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');

const listAssessments = asyncHandler(async (req, res) => {
  const assessments = await Assessment.find().populate('questions.question').sort({ createdAt: -1 });
  res.json({ assessments });
});

const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id).populate('questions.question assignedStudents');
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // If student, check if completed
  if (req.user && req.user.role === 'student') {
    if (req.user.completedAssessments?.includes(assessment._id)) {
      return res.json({ assessment: { ...assessment.toObject(), isCompleted: true } });
    }
  }

  res.json({ assessment });
});

const createAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.create(req.body);
  res.status(201).json({ assessment });
});

const updateAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }
  res.json({ assessment });
});

const assignAssessment = asyncHandler(async (req, res) => {
  const { studentIds = [], batchNames = [] } = req.body;
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (studentIds.length) {
    assessment.assignedStudents = Array.from(new Set([...(assessment.assignedStudents || []).map(String), ...studentIds.map(String)])).map((id) => id);
  }

  if (batchNames.length) {
    assessment.assignedBatches = Array.from(new Set([...(assessment.assignedBatches || []), ...batchNames]));
  }

  await assessment.save();
  res.json({ assessment });
});

const deleteAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findByIdAndDelete(req.params.id);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }
  res.json({ message: 'Assessment deleted' });
});

const completeAssessment = asyncHandler(async (req, res) => {
  const assessmentId = req.params.id;
  const user = await User.findById(req.user._id);
  
  if (!user.completedAssessments) {
    user.completedAssessments = [];
  }
  
  if (!user.completedAssessments.includes(assessmentId)) {
    user.completedAssessments.push(assessmentId);
    await user.save();
  }
  
  res.json({ message: 'Assessment marked as completed' });
});

const studentAssessments = asyncHandler(async (req, res) => {
  const assessments = await Assessment.find({
    status: { $in: ['live', 'scheduled'] },
    $or: [{ assignedStudents: req.user._id }, { assignedBatches: String(req.user.batch) }]
  })
    .populate('questions.question')
    .sort({ createdAt: -1 });

  const submissionCounts = await Submission.aggregate([
    { $match: { student: req.user._id } },
    { $group: { _id: '$assessment', count: { $sum: 1 } } }
  ]);

  const countsMap = new Map(submissionCounts.map((item) => [String(item._id), item.count]));

  res.json({
    assessments: assessments.map((assessment) => ({
      ...assessment.toObject(),
      submissionCount: countsMap.get(String(assessment._id)) || 0,
      isCompleted: req.user.completedAssessments?.includes(assessment._id) || false
    }))
  });
});

module.exports = {
  listAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  assignAssessment,
  deleteAssessment,
  studentAssessments,
  completeAssessment
};
