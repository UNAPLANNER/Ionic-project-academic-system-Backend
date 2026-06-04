const express = require('express');
const router = express.Router();
const { getCourses, getStudentsByCourse, createCourse, updateCourse, deleteCourse } = require('../controllers/courses.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

router.get('/',             verifyToken, checkRole('teacher', 'admin'), getCourses);
router.post('/',            verifyToken, checkRole('teacher', 'admin'), createCourse);
router.put('/:id',          verifyToken, checkRole('teacher', 'admin'), updateCourse);
router.delete('/:id',       verifyToken, checkRole('teacher', 'admin'), deleteCourse);
router.get('/:id/students', verifyToken, checkRole('teacher', 'admin'), getStudentsByCourse);

module.exports = router;
