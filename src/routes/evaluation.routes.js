const express = require("express");

const router = express.Router();

const {
    createEvaluation
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

module.exports = router;