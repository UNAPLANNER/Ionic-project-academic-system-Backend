const validateEvaluation = (req, res, next) => {

    const {
        studentId,
        courseId,
        type,
        score,
        maxScore,
        date,
        description
    } = req.body;
    // Validate required fields
    if (
        !studentId ||
        !courseId ||
        !type ||
        score === undefined ||
        maxScore === undefined ||
        !date ||
        !description
    ) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }
    // Validate allowed evaluation types
    const validTypes = [
        "exam",
        "assignment",
        "project"
    ];
    
    //Validate score <= maxScore
    if (!validTypes.includes(type)) {
        return res.status(400).json({
            message: "Invalid evaluation type"
        });
    }
    //Ensure score does not exceed maximum score
    if (score > maxScore) {
        return res.status(400).json({
            message: "Score cannot exceed maxScore"
        });
    }
    // Continue to controller if validation succeeds
    next();
};

module.exports = {
    validateEvaluation
};