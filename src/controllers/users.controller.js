const { auth, db } = require('../config/firebase');
const { validateUserFields, toUserResponse } = require('../models/user.model');

// GET /api/users/teachers
const getTeachers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').where('role', '==', 'teacher').get();

    const teachers = snapshot.docs.map(doc => toUserResponse(doc, 'teacher'));

    return res.status(200).json({ teachers });
  } catch (error) {
    console.error('Get teachers error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/users/teachers
const createTeacher = async (req, res) => {
  const { name, email, password } = req.body;

  const missing = validateUserFields(req.body);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await db.collection('users').where('email', '==', email).get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });

    const teacher = {
      id: userRecord.uid,
      name,
      email,
      role: 'teacher',
      createdAt: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(teacher);

    return res.status(201).json({
      message: 'Teacher created successfully',
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role
      }
    });
  } catch (error) {
    console.error('Create teacher error:', error);

    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password is too weak' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

const saveDeviceToken = async (req, res) => {
  try {
    const { userId, deviceToken } = req.body;

    if (!userId || !deviceToken) {
      return res.status(400).json({
        message: "userId and deviceToken are required"
      });
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    await userRef.update({
      deviceToken
    });

    return res.json({
      message: "Token saved successfully"
    });

  } catch (error) {
    console.error("Error saving device token:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


module.exports = { getTeachers, createTeacher, saveDeviceToken };


