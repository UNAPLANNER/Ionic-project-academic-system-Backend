const express = require('express');
const router = express.Router();
const { getAllStudents, createStudent, updateStudent } = require('../controllers/students.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

router.get('/',     verifyToken, checkRole('teacher', 'admin'), getAllStudents);
router.post('/',    verifyToken, checkRole('teacher', 'admin'), createStudent);
router.put('/:id',  verifyToken, checkRole('teacher', 'admin'), updateStudent);

module.exports = router;
