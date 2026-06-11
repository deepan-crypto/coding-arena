const express = require('express');
const { askMentor, chatMentor } = require('../controllers/mentorController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/ask', requireAuth, askMentor);
router.post('/chat', requireAuth, chatMentor);

module.exports = router;
