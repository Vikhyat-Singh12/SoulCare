import express from "express";
import {
  bookSession,
  bookFollowUpSession,
  cancelSession,
  getCounsellorSessions,
  getStudentSessions,
  getAllSessions,
  getAvailableSlots,
  updateSessionStatus,
  getTurnCredentials,
  getSessionInfo,
  submitFeedback,
} from "../controller/session.controller.js";
import {
  adminMiddleware,
  commonMiddleware,
  counsellorMiddleware,
  studentMiddleware,
} from "../middlewares/user.middleware.js";

const router = express.Router();

// Any authenticated user can fetch available slots (students need this on booking page)
router.get("/available-slots", commonMiddleware, getAvailableSlots);

// Student books a session (must be logged in as student)
router.post("/create-room", studentMiddleware, bookSession);

// Counsellor books a follow-up session on behalf of a student
router.post("/book-followup", counsellorMiddleware, bookFollowUpSession);

// Student cancels their own upcoming session
router.delete("/:id", studentMiddleware, cancelSession);

// Counsellor views their appointments (anonymous data only)
router.get("/counsellor", counsellorMiddleware, getCounsellorSessions);

// Student views their own appointments
router.get("/student", studentMiddleware, getStudentSessions);

// Admin views all sessions with full student details, grouped by counsellor
router.get("/all", adminMiddleware, getAllSessions);

// Counsellor or admin can update session status
router.patch("/:id/status", commonMiddleware, updateSessionStatus);

// Get TURN/STUN ICE server credentials for WebRTC
router.get("/turn-credentials", commonMiddleware, getTurnCredentials);

// Secure: returns session info (type, counsellor, etc.) only to the booked student or matched counsellor
router.get("/info/:roomName", commonMiddleware, getSessionInfo);

// Counsellor submits post-session feedback/report
router.patch("/:id/feedback", counsellorMiddleware, submitFeedback);

export default router;