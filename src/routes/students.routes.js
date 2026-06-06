const express = require('express');
const router = express.Router();
const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/students.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

router.get('/',        verifyToken, checkRole('teacher', 'admin'), getStudents);
router.get('/:id',     verifyToken, checkRole('teacher', 'admin'), getStudentById);
router.post('/',       verifyToken, checkRole('admin'), createStudent);
router.put('/:id',     verifyToken, checkRole('admin'), updateStudent);
router.delete('/:id',  verifyToken, checkRole('admin'), deleteStudent);

module.exports = router;
