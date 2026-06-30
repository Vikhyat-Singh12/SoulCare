import express from "express";
import {
  generateFeedback,
  getSessionInfoForFeedback,
  getStudentFeedback,
  getCounsellorFeedback,
  getAllFeedback,
  getFeedbackById,
  getFeedbackBySessionId,
} from "../controller/feedback.controller.js";
import {
  adminMiddleware,
  commonMiddleware,
  counsellorMiddleware,
  studentMiddleware,
} from "../middlewares/user.middleware.js";

const router = express.Router();

// Counsellor: fetch session details to pre-fill the form
router.get("/session-info/:sessionId", counsellorMiddleware, getSessionInfoForFeedback);

// Counsellor submits feedback for a student session
router.post("/create", counsellorMiddleware, generateFeedback);

// Student views their own feedback reports
router.get("/student", studentMiddleware, getStudentFeedback);

// Counsellor views all feedback they submitted
router.get("/counsellor", counsellorMiddleware, getCounsellorFeedback);

// Admin views all feedback on the platform
router.get("/all", adminMiddleware, getAllFeedback);

// Fetch feedback linked to a specific session
router.get("/by-session/:sessionId", commonMiddleware, getFeedbackBySessionId);

// Any authenticated user with permission can view a specific report by Mongo _id
router.get("/:id", commonMiddleware, getFeedbackById);

export default router;
