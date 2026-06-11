const express = require('express');
const { dashboard, listStudents, createStudent, updateStudent, deleteStudent } = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', requireAuth, requireRole('admin'), dashboard);
router.get('/students', requireAuth, requireRole('admin'), listStudents);
router.post('/students', requireAuth, requireRole('admin'), createStudent);
router.put('/students/:id', requireAuth, requireRole('admin'), updateStudent);
router.delete('/students/:id', requireAuth, requireRole('admin'), deleteStudent);

module.exports = router;
