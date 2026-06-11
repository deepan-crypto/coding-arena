const express = require('express');
const { dashboard } = require('../controllers/studentController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', requireAuth, requireRole('student'), dashboard);

module.exports = router;
