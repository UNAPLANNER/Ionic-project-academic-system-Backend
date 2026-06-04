const { db } = require('../config/firebase');
const { validateCourseFields } = require('../models/course.model');

// GET /api/courses
// Teacher: only their own courses. Admin: all courses.
const getCourses = async (req, res) => {
  try {
    let query = db.collection('courses');

    if (req.user.role === 'teacher') {
      query = query.where('teacherId', '==', req.user.uid);
    }

    const snapshot = await query.get();

    const courses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id ?? doc.id,
        name: data.name ?? '',
        code: data.code ?? '',
        credits: data.credits ?? 0,
        schedule: data.schedule ?? '',
        teacherId: data.teacherId ?? '',
        students: Array.isArray(data.students) ? data.students : [],
        totalStudents: Array.isArray(data.students) ? data.students.length : 0
      };
    });

    return res.status(200).json({ courses });

  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/courses
// Teacher creates a course assigned to themselves. Admin can optionally send teacherId.
const createCourse = async (req, res) => {
  const { name, code, credits, schedule, teacherId } = req.body;
  const missing = validateCourseFields(req.body);

  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  if (typeof credits !== 'number' || credits < 1) {
    return res.status(400).json({ error: 'credits must be a positive number' });
  }

  try {
    const existing = await db.collection('courses').where('code', '==', code).get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'A course with this code already exists' });
    }

    const ref = db.collection('courses').doc();
    const course = {
      id: ref.id,
      name,
      code,
      credits,
      schedule,
      teacherId: req.user.role === 'admin' ? (teacherId ?? req.user.uid) : req.user.uid,
      students: [],
      createdAt: new Date()
    };

    await ref.set(course);

    return res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    console.error('Create course error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/courses/:id
// Teacher can update only their own courses. Admin can update any course.
const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { name, code, credits, schedule } = req.body;
  const missing = validateCourseFields(req.body);

  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  if (typeof credits !== 'number' || credits < 1) {
    return res.status(400).json({ error: 'credits must be a positive number' });
  }

  try {
    const ref = db.collection('courses').doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const current = doc.data();
    if (req.user.role === 'teacher' && current.teacherId !== req.user.uid) {
      return res.status(403).json({ error: 'Access forbidden: this course does not belong to you' });
    }

    const duplicate = await db.collection('courses').where('code', '==', code).get();
    const duplicateCourse = duplicate.docs.find(courseDoc => courseDoc.id !== id);
    if (duplicateCourse) {
      return res.status(409).json({ error: 'A course with this code already exists' });
    }

    const updates = { name, code, credits, schedule, updatedAt: new Date() };
    await ref.update(updates);

    return res.status(200).json({
      message: 'Course updated successfully',
      course: { id, ...current, ...updates }
    });
  } catch (error) {
    console.error('Update course error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/courses/:id/students
// Teacher can only access students from their own courses.
const getStudentsByCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const courseDoc = await db.collection('courses').doc(id).get();

    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const courseData = courseDoc.data();

    if (req.user.role === 'teacher' && courseData.teacherId !== req.user.uid) {
      return res.status(403).json({ error: 'Access forbidden: this course does not belong to you' });
    }

    const studentIds = courseData.students ?? [];

    if (studentIds.length === 0) {
      return res.status(200).json({ students: [] });
    }

    // Fetch students in batches of 30 (Firestore 'in' limit)
    const chunks = [];
    for (let i = 0; i < studentIds.length; i += 30) {
      chunks.push(studentIds.slice(i, i + 30));
    }

    const studentDocs = [];
    for (const chunk of chunks) {
      const snap = await db.collection('users')
        .where('id', 'in', chunk)
        .where('role', '==', 'student')
        .get();
      studentDocs.push(...snap.docs);
    }

    const students = studentDocs.map(doc => {
      const data = doc.data();
      return {
        id:       data.id,
        name:     data.name,
        email:    data.email,
        career:   data.career   ?? null,
        semester: data.semester ?? null,
        photoUrl: data.photoUrl ?? null
      };
    });

    return res.status(200).json({ students });

  } catch (error) {
    console.error('Get students by course error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getCourses, getStudentsByCourse, createCourse, updateCourse };
