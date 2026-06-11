const express = require('express');
const {
  listAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  assignAssessment,
  deleteAssessment,
  studentAssessments,
  completeAssessment
} = require('../controllers/assessmentController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), listAssessments);
router.get('/student', requireAuth, studentAssessments);
router.get('/:id', requireAuth, getAssessment);
router.post('/', requireAuth, requireRole('admin'), createAssessment);
router.post('/:id/complete', requireAuth, requireRole('student'), completeAssessment);
router.put('/:id', requireAuth, requireRole('admin'), updateAssessment);
router.patch('/:id/assign', requireAuth, requireRole('admin'), assignAssessment);
router.delete('/:id', requireAuth, requireRole('admin'), deleteAssessment);

module.exports = router;
