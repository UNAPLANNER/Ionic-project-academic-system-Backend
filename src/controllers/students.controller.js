const { db } = require('../config/firebase');
const { validateStudentFields } = require('../models/student.model');

// GET /api/students
const getStudents = async (req, res) => {
  try {
    const snapshot = await db.collection('users').where('role', '==', 'student').get();

    const students = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id ?? doc.id,
        name: data.name,
        email: data.email,
        career: data.career ?? null,
        semester: data.semester ?? null,
        photoUrl: data.photoUrl ?? null
      };
    });

    return res.status(200).json({ students });

  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/students
const createStudent = async (req, res) => {
  const { name, email, career, semester, photoUrl } = req.body;

  const missing = validateStudentFields(req.body);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  if (typeof semester !== 'number' || semester < 1) {
    return res.status(400).json({ error: 'semester must be a positive number' });
  }

  try {
    const existing = await db.collection('users').where('email', '==', email).get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const ref = db.collection('users').doc();
    const student = {
      id: ref.id,
      name,
      email,
      career,
      semester,
      photoUrl: photoUrl ?? null,
      role: 'student',
      createdAt: new Date()
    };

    await ref.set(student);

    return res.status(201).json({ message: 'Student created successfully', student });

  } catch (error) {
    console.error('Create student error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/students/:id
const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, email, career, semester, photoUrl } = req.body;

  const missing = validateStudentFields(req.body);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  if (typeof semester !== 'number' || semester < 1) {
    return res.status(400).json({ error: 'semester must be a positive number' });
  }

  try {
    const ref = db.collection('users').doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const updates = { name, email, career, semester, photoUrl: photoUrl ?? null };
    await ref.update(updates);

    return res.status(200).json({ message: 'Student updated successfully', student: { id, ...updates } });

  } catch (error) {
    console.error('Update student error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/students/:id
const getStudentById = async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection('users').doc(id).get();

    if (!doc.exists || doc.data().role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }

    const data = doc.data();
    return res.status(200).json({
      id:       data.id ?? doc.id,
      name:     data.name,
      email:    data.email,
      career:   data.career   ?? null,
      semester: data.semester ?? null,
      photoUrl: data.photoUrl ?? null
    });

  } catch (error) {
    console.error('Get student error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/students/:id
const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const ref = db.collection('users').doc(id);
    const doc = await ref.get();

    if (!doc.exists || doc.data().role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }

    await ref.delete();

    return res.status(200).json({ message: 'Student deleted successfully' });

  } catch (error) {
    console.error('Delete student error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getStudents, getStudentById, createStudent, updateStudent, deleteStudent };
