const { db } = require('../config/firebase');
const { validateCourseFields } = require('../models/course.model');

// GET /api/courses
// Teacher: only their own courses. Student: only enrolled courses. Admin: all courses.
const getCourses = async (req, res) => {
  try {
    let query = db.collection('courses');

    if (req.user.role === 'teacher') {
      query = query.where('teacherId', '==', req.user.uid);
    } else if (req.user.role === 'student') {
      query = query.where('students', 'array-contains', req.user.uid);
    }

    const snapshot = await query.get();

    const courses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
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

// DELETE /api/courses/:id
// Teacher can delete only their own courses. Admin can delete any course.
const deleteCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const ref = db.collection('courses').doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = doc.data();
    if (req.user.role === 'teacher' && course.teacherId !== req.user.uid) {
      return res.status(403).json({ error: 'Access forbidden: this course does not belong to you' });
    }

    await ref.delete();

    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/courses/:id/students
// Replaces the enrolled students list. Empty array is allowed.
const updateCourseStudents = async (req, res) => {
  const { id } = req.params;
  const { students } = req.body;

  if (!Array.isArray(students)) {
    return res.status(400).json({ error: 'students must be an array' });
  }

  const hasInvalidIds = students.some(studentId => typeof studentId !== 'string' || studentId.trim() === '');
  if (hasInvalidIds) {
    return res.status(400).json({ error: 'students must contain only valid student IDs' });
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

    const uniqueStudents = [...new Set(students)];
    const updates = { students: uniqueStudents, updatedAt: new Date() };
    await ref.update(updates);

    return res.status(200).json({
      message: 'Course students updated successfully',
      course: {
        id: doc.id,
        ...current,
        ...updates,
        totalStudents: uniqueStudents.length
      }
    });
  } catch (error) {
    console.error('Update course students error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/courses/:id/teacher
// Admin assigns or changes the teacher responsible for a course.
const updateCourseTeacher = async (req, res) => {
  const { id } = req.params;
  const { teacherId } = req.body;

  if (!teacherId || typeof teacherId !== 'string') {
    return res.status(400).json({ error: 'teacherId is required' });
  }

  try {
    const courseRef = db.collection('courses').doc(id);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const teacherDoc = await db.collection('users').doc(teacherId).get();
    if (!teacherDoc.exists || teacherDoc.data().role !== 'teacher') {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const updates = { teacherId, updatedAt: new Date() };
    await courseRef.update(updates);

    return res.status(200).json({
      message: 'Course teacher updated successfully',
      course: {
        id: courseDoc.id,
        ...courseDoc.data(),
        ...updates
      }
    });
  } catch (error) {
    console.error('Update course teacher error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/courses/:id/students
// Teacher can only access students from their own courses. Student can access enrolled courses.
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

    if (req.user.role === 'student' && !courseData.students?.includes(req.user.uid)) {
      return res.status(403).json({ error: 'Access forbidden: you are not enrolled in this course' });
    }

    const studentIds = courseData.students ?? [];

    if (studentIds.length === 0) {
      return res.status(200).json({ students: [] });
    }

    const studentDocs = [];
    for (const studentId of studentIds) {
      const studentDoc = await db.collection('users').doc(studentId).get();

      if (studentDoc.exists && studentDoc.data().role === 'student') {
        studentDocs.push(studentDoc);
        continue;
      }

      const snap = await db.collection('users')
        .where('id', '==', studentId)
        .where('role', '==', 'student')
        .limit(1)
        .get();

      if (!snap.empty) {
        studentDocs.push(snap.docs[0]);
      }
    }

    const students = studentDocs.map(doc => {
      const data = doc.data();
      return {
        id:       data.id ?? doc.id,
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

module.exports = {
  getCourses,
  getStudentsByCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseStudents,
  updateCourseTeacher
};
