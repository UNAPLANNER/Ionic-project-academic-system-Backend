const express = require('express');
const router = express.Router();
const { getTeachers, createTeacher,saveDeviceToken } = require('../controllers/users.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

router.get('/teachers', verifyToken, checkRole('admin'), getTeachers);
router.post('/teachers', verifyToken, checkRole('admin'), createTeacher);

router.put("/device-token",saveDeviceToken);

module.exports = router;
