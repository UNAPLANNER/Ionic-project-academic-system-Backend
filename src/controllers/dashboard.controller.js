const { db } = require('../config/firebase');

exports.getMetrics = async (req, res) => {
  try {
    //STUDENTS
    const studentsSnap = await db
      .collection('users')
      .where('role', '==', 'student')
      .get();

    const students = studentsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const totalStudents = studentsSnap.size;

    //COURSES
    const coursesSnap = await db.collection('courses').get();
    const courses = coursesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const totalCourses = coursesSnap.size;

    //EVALUATIONS
    const evalSnap = await db.collection('evaluations').get();
    const evaluations = evalSnap.docs.map(doc => doc.data());

    const totalEvaluations = evalSnap.size;

    //OVERALL AVERAGE
    let sum = 0;
    evaluations.forEach(e => {
      sum += e.score || 0;
    });

    const overallAverage = evaluations.length
      ? sum / evaluations.length
      : 0;

    //AT RISK STUDENTS (<60)
    let atRiskCount = 0;

    students.forEach(student => {
      const studentEvals = evaluations.filter(
        e => e.studentId === student.id
      );

      if (studentEvals.length > 0) {
        const avg =
          studentEvals.reduce((acc, e) => acc + (e.score || 0), 0) /
          studentEvals.length;

        if (avg < 60) atRiskCount++;
      }
    });

    //PERFORMANCE BY COURSE
    const performanceByCourse = courses.map(course => {
      const courseEvals = evaluations.filter(
        e => e.courseId === course.id
      );

      const avg = courseEvals.length
        ? courseEvals.reduce((acc, e) => acc + (e.score || 0), 0) /
          courseEvals.length
        : 0;

      return {
        courseId: course.id,
        courseName: course.name,
        average: Number(avg.toFixed(2))
      };
    });

    res.json({
      totalStudents,
      totalCourses,
      totalEvaluations,
      overallAverage: Number(overallAverage.toFixed(2)),
      atRiskCount,
      performanceByCourse
    });

  } catch (error) {
    console.error("🔥 DASHBOARD ERROR:", error);
    res.status(500).json({
      message: 'Error loading dashboard metrics',
      error: error.message
    });
  }
};