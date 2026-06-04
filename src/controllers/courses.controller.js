const { db } = require('../config/firebase');

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
        id:            data.id,
        name:          data.name,
        code:          data.code,
        credits:       data.credits,
        schedule:      data.schedule,
        teacherId:     data.teacherId,
        totalStudents: (data.students ?? []).length
      };
    });

    return res.status(200).json({ courses });

  } catch (error) {
    console.error('Get courses error:', error);
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

module.exports = { getCourses, getStudentsByCourse };
