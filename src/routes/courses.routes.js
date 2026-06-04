const express = require('express');
const router = express.Router();
const { getCourses, getStudentsByCourse } = require('../controllers/courses.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

router.get('/',             verifyToken, checkRole('teacher', 'admin'), getCourses);
router.get('/:id/students', verifyToken, checkRole('teacher', 'admin'), getStudentsByCourse);

module.exports = router;
