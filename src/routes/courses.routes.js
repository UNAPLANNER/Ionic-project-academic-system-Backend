const express = require('express');
const router = express.Router();
const {
  getCourses,
  getStudentsByCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseStudents,
  updateCourseTeacher
} = require('../controllers/courses.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

router.get('/',             verifyToken, checkRole('teacher', 'admin', 'student'), getCourses);
router.post('/',            verifyToken, checkRole('admin'), createCourse);
router.put('/:id/students', verifyToken, checkRole('admin'), updateCourseStudents);
router.get('/:id/students', verifyToken, checkRole('teacher', 'admin', 'student'), getStudentsByCourse);
router.put('/:id/teacher',  verifyToken, checkRole('admin'), updateCourseTeacher);
router.put('/:id',          verifyToken, checkRole('admin'), updateCourse);
router.delete('/:id',       verifyToken, checkRole('admin'), deleteCourse);

module.exports = router;
