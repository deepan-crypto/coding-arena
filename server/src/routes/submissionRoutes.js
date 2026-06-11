const express = require('express');
const {
  runCode,
  submitCode,
  listMySubmissions,
  getSubmission,
  submissionsByAssessment
} = require('../controllers/submissionController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/run', requireAuth, runCode);
router.post('/submit', requireAuth, submitCode);
router.get('/me', requireAuth, listMySubmissions);
router.get('/assessment/:assessmentId', requireAuth, requireRole('admin'), submissionsByAssessment);
router.get('/:id', requireAuth, getSubmission);

module.exports = router;
