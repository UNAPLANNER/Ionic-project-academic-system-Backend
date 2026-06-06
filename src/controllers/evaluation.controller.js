const { db, admin } = require("../config/firebase");

//Post /api/evaluations endpoint
const createEvaluation = async (req, res) => {
  try {
    const {
      studentId,
      courseId,
      type,
      score,
      maxScore,
      date,
      description
    } = req.body;

    // Build evaluation object
    const evaluation = {
      studentId,
      courseId,
      type,
      score,
      maxScore,
      date,
      description
    };

    // Save evaluation into Firestore collection
    const docRef = await db
      .collection("evaluations")
      .add(evaluation);

    // Search student
    const studentDoc = await db
      .collection("users")
      .doc(studentId)
      .get();

    // If student exists
    if (studentDoc.exists) {
      const studentData = studentDoc.data();

      // If student has a registered device token
      if (studentData.deviceToken) {

        // Search course to get course name
        const courseDoc = await db
          .collection("courses")
          .doc(courseId)
          .get();

        // Default value if course is not found
        const courseName = courseDoc.exists
          ? courseDoc.data().name
          : courseId;

        const message = {
          token: studentData.deviceToken,
          notification: {
            title: "New Evaluation",
            body: `${courseName} - Score: ${score}`
          }
        };

        try {
          await admin.messaging().send(message);
        } catch (err) {
          console.log("Notification skipped:", err.message);
        }
      }
    }

    // Return created resource with generated id
    return res.status(201).json({
      id: docRef.id,
      ...evaluation
    });

  } catch (error) {
    // Handle unexpected server errors
    return res.status(500).json({
      message: error.message
    });
  }
};

//GET /api/evaluations/student/:id endpoints
const getStudentEvaluations = async (req, res) => {
  try {
    const studentId = req.params.id;

    const snapshot = await db
      .collection("evaluations")
      .where("studentId", "==", studentId)
      .get();

    //If there are no reviews → return empty (NOT 404)
    if (snapshot.empty) {
      return res.status(200).json({
        evaluations: [],
        average: 0
      });
    }

    let evaluations = [];
    let total = 0;

    snapshot.forEach(doc => {
      const data = doc.data();

      const percentage = (data.score / data.maxScore) * 100;
      total += percentage;

      evaluations.push({
        id: doc.id,
        type: data.type,
        score: data.score,
        maxScore: data.maxScore,
        date: data.date,
        courseId: data.courseId,
        description: data.description
      });
    });

    // Sort by date in descending order
    evaluations.sort((a, b) => new Date(b.date) - new Date(a.date));

    const average = total / evaluations.length;

    return res.status(200).json({
      evaluations,
      average: Number(average.toFixed(2))
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

//GET ALL EVALUATIONS PROFESOR
const getEvaluations = async (req, res) => {
  try {
    const snapshot = await db.collection("evaluations").get();

    let evaluations = [];

    snapshot.forEach(doc => {
      evaluations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return res.status(200).json(evaluations);

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};
//UPDATE EVALUATIONS PROFESOR
const updateEvaluation = async (req, res) => {
  try {
    const id = req.params.id;

    await db.collection("evaluations").doc(id).update(req.body);

    return res.status(200).json({
      message: "Evaluation updated"
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};
//DELETE EVALUATION PROFESOR
const deleteEvaluation = async (req, res) => {
  try {
    const id = req.params.id;

    await db.collection("evaluations").doc(id).delete();

    return res.status(200).json({
      message: "Evaluation deleted"
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
    createEvaluation,
    getStudentEvaluations,
    getEvaluations,
    updateEvaluation,
    deleteEvaluation
};
