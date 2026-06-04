const { db } = require('../config/firebase');

// GET /api/courses
const getAllCourses = async (req, res) => {
  try {
    const snapshot = await db.collection('courses').get();

    const courses = snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        id: data.id ?? doc.id,
        name: data.name ?? '',
        code: data.code ?? '',
        teacherId: data.teacherId ?? '',
        credits: data.credits ?? 0,
        schedule: data.schedule ?? '',
        students: Array.isArray(data.students) ? data.students : []
      };
    });

    return res.status(200).json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllCourses };
