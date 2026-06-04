const { db } = require("../config/firebase");

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

module.exports = {
    createEvaluation
};