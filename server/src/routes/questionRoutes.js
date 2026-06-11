const express = require('express');
const {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion
} = require('../controllers/questionController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, listQuestions);
router.get('/:id', requireAuth, getQuestion);
router.post('/', requireAuth, requireRole('admin'), createQuestion);
router.put('/:id', requireAuth, requireRole('admin'), updateQuestion);
router.delete('/:id', requireAuth, requireRole('admin'), deleteQuestion);

module.exports = router;
