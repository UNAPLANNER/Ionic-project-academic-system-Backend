const express = require('express');
const router = express.Router();
const { getStudents, getStudentById, createStudent, updateStudent } = require('../controllers/students.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

router.get('/',     verifyToken, checkRole('teacher', 'admin'), getStudents);
router.get('/:id',  verifyToken, checkRole('teacher', 'admin'), getStudentById);
router.post('/',    verifyToken, checkRole('teacher', 'admin'), createStudent);
router.put('/:id',  verifyToken, checkRole('teacher', 'admin'), updateStudent);

module.exports = router;
