const express = require("express");

const router = express.Router();

const {
    createEvaluation,
    getStudentEvaluations
} = require("../controllers/evaluation.controller");

const {
    validateEvaluation
} = require("../middleware/evaluation.middleware");

// POST /api/evaluations
// Creates a new evaluation after validation
router.post(
    "/",
    validateEvaluation,
    createEvaluation
);

// GET /api/evaluations/student/:id
router.get("/student/:id", getStudentEvaluations);

module.exports = router;