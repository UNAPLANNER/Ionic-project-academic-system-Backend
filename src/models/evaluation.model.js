const evaluationSchema = {
    id: String,
    studentId: String,
    courseId: String,
    type: String, // exam | assignment | project
    score: Number,
    maxScore: Number,
    date: Date,
    description: String
};

module.exports = evaluationSchema;