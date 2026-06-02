const { db } = require('../config/firebase');

// GET /api/students
const getAllStudents = async (req, res) => {
  try {
    const snapshot = await db.collection('users').where('role', '==', 'student').get();

    const students = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        career: data.career ?? null,
        semester: data.semester ?? null
      };
    });

    return res.status(200).json({ students });

  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllStudents };
