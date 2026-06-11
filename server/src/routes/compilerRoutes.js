const express = require('express');
const router = express.Router();
const { runCode, submitCode } = require('../controllers/compilerController');
const { requireAuth } = require('../middleware/auth');

router.post('/run', requireAuth, runCode);
router.post('/submit', requireAuth, submitCode);

module.exports = router;
