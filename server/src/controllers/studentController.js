const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');
const { asyncHandler } = require('../utils/asyncHandler');

const dashboard = asyncHandler(async (req, res) => {
  const assessments = await Assessment.find({
    $or: [{ assignedStudents: req.user._id }, { assignedBatches: req.user.batch }, { status: { $in: ['live', 'scheduled'] } }]
  })
    .populate('questions.question')
    .sort({ createdAt: -1 });

  const submissions = await Submission.find({ student: req.user._id })
    .populate('assessment question')
    .sort({ createdAt: -1 })
    .limit(10);

  const leaderboard = await Submission.aggregate([
    { $group: { _id: '$student', totalScore: { $sum: '$score' }, attempts: { $sum: 1 } } },
    { $sort: { totalScore: -1 } },
    { $limit: 10 }
  ]);

  const user = req.user;
  res.json({
    upcomingAssessments: assessments.map(a => ({
      ...a.toObject(),
      isCompleted: user.completedAssessments?.includes(a._id) || false
    })),
    recentSubmissions: submissions,
    leaderboard
  });
});

module.exports = { dashboard };
