import crypto from "crypto";
import Feedback from "../models/feedback.model.js";
import Session  from "../models/session.model.js";
import { getIO } from "../socket/socket.js";

// ─── Controllers ─────────────────────────────────────────────────────────────

const generateMeetingData = () => {
  const roomId = crypto.randomBytes(8).toString("hex");
  const domain = "https://jitsi.riot.im";
  return {
    meetingLink: `${domain}/SoulCare-${roomId}`,
    roomId,
  };
};

function generateAllSlots(startHour = 10, startMin = 0, endHour = 17, endMin = 0) {
  const slots = [];
  let h = startHour;
  let m = startMin;

  while (h < endHour || (h === endHour && m < endMin)) {
    const period = h < 12 ? "AM" : "PM";
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const displayM = m === 0 ? "00" : String(m);
    slots.push(`${displayH}:${displayM} ${period}`);

    m += 30;
    if (m >= 60) {
      m = 0;
      h += 1;
    }
  }
  return slots;
}

function slotToDate(dateStr, slotStr) {
  const [timePart, period] = slotStr.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const d = new Date(dateStr + "T00:00:00");
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * GET /api/feedback/session-info/:sessionId
 * Counsellor fetches session info (student name, date, slot, type) to
 * auto-populate the feedback form. Only the matched counsellor can access.
 */
export const getSessionInfoForFeedback = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const c_id = req.user.c_id;

    // Try direct _id lookup first, then by session_id field, then by room name in link
    let session = null;

    // 1. Try MongoDB _id
    try { session = await Session.findById(sessionId).populate("student_id", "name email"); } catch (_) {}

    // 2. Try session_id field
    if (!session) {
      session = await Session.findOne({ session_id: sessionId }).populate("student_id", "name email");
    }

    // 3. Try matching the room name at the end of session_link
    if (!session) {
      const escapedId = sessionId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      session = await Session.findOne({
        session_link: { $regex: escapedId + "$", $options: "i" },
      }).populate("student_id", "name email");
    }

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Security: only the counsellor who owns this session can fetch it
    if (session.c_id !== c_id) {
      return res.status(403).json({ message: "You are not authorised to access this session" });
    }

    return res.status(200).json({
      session_id:   session._id.toString(),
      session_type: session.session_type || "video",
      c_id:         session.c_id,
      date:         session.date,
      slot:         session.slot,
      anonymous_id: session.anonymous_id,
      student_name: session.student_id?.name || session.anonymous_id,
      student_email:session.student_id?.email || "",
      status:       session.status,
    });
  } catch (err) {
    console.error("Error in getSessionInfoForFeedback:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/feedback/create
 * Counsellor submits feedback for a student session.
 * Supports both point-wise (arrays) and legacy (string) formats.
 */
export const generateFeedback = async (req, res) => {
  try {
    const {
      anonymous_id,
      student_name,
      session_id,
      session_type,
      date,
      slot,
      status,
      mood_rating,
      risk_level,
      // point-wise (preferred)
      feedback_points,
      recommendation_steps,
      // legacy fallback
      problems,
      recommendations,
      // follow-up
      follow_up_date,
      follow_up_slot,
      follow_up_notes,
    } = req.body;

    const c_id           = req.user.c_id;
    const counsellor_name = req.user.name;

    if (!anonymous_id || !student_name) {
      return res.status(400).json({ message: "Student information is required" });
    }
    if (!c_id) {
      return res.status(400).json({ message: "Counsellor ID not found on your account" });
    }

    // Normalise point-wise fields — accept array or comma-separated string
    const normPoints = (val) => {
      if (Array.isArray(val)) return val.filter(Boolean).map(s => s.trim());
      if (typeof val === "string" && val.trim()) return [val.trim()];
      return [];
    };

    const fpArr = normPoints(feedback_points);
    const rsArr = normPoints(recommendation_steps);

    // Require at least one feedback point or a legacy string
    const hasFeedback = fpArr.length > 0 || (problems && problems.trim());
    const hasRecommendations = rsArr.length > 0 || (recommendations && recommendations.trim());

    if (!hasFeedback) {
      return res.status(400).json({ message: "At least one session feedback point is required" });
    }
    if (!hasRecommendations) {
      return res.status(400).json({ message: "At least one recommendation step is required" });
    }

    let followUpSession = null;
    if ((follow_up_date && !follow_up_slot) || (!follow_up_date && follow_up_slot)) {
      return res.status(400).json({ message: "Select both follow-up date and slot, or leave follow-up empty" });
    }

    if (follow_up_date && follow_up_slot) {
      if (!session_id) {
        return res.status(400).json({ message: "Original session is required to book a follow-up" });
      }

      const original = await Session.findById(session_id);
      if (!original) return res.status(404).json({ message: "Original session not found" });
      if (original.c_id !== c_id) return res.status(403).json({ message: "Not authorised to book follow-up for this session" });

      if (!generateAllSlots().includes(follow_up_slot)) {
        return res.status(400).json({ message: "Invalid follow-up slot selected" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reqDate = new Date(follow_up_date + "T00:00:00");
      reqDate.setHours(0, 0, 0, 0);
      if (reqDate < today) return res.status(400).json({ message: "Cannot book follow-up for a past date" });

      const slotTime = slotToDate(follow_up_date, follow_up_slot);
      if (reqDate.getTime() === today.getTime() && slotTime <= new Date()) {
        return res.status(400).json({ message: "This follow-up slot has already passed" });
      }

      const conflict = await Session.findOne({
        c_id,
        date: { $gte: new Date(follow_up_date + "T00:00:00.000Z"), $lt: new Date(follow_up_date + "T23:59:59.999Z") },
        slot: follow_up_slot,
        status: { $in: ["pending", "upcoming"] },
      });
      if (conflict) return res.status(409).json({ message: "That follow-up slot is already booked for this counsellor" });

      const meetingData = generateMeetingData();
      followUpSession = await Session.create({
        c_id:         original.c_id,
        c_name:       original.c_name,
        anonymous_id: original.anonymous_id,
        student_id:   original.student_id,
        slot:         follow_up_slot,
        date:         new Date(follow_up_date),
        session_id:   meetingData.roomId,
        session_link: meetingData.meetingLink,
        status:       "upcoming",
        session_type: original.session_type,
      });
    }

    let feedback;
    try {
      feedback = await Feedback.create({
      c_id,
      counsellor_name,
      anonymous_id,
      student_name,
      session_id:     session_id || "",
      session_type:   session_type || "",
      date:           date ? new Date(date) : new Date(),
      slot:           slot || "",
      status:         status || "stable",
      mood_rating:    mood_rating ? Number(mood_rating) : null,
      risk_level:     risk_level || "low",
      // point-wise
      feedback_points:      fpArr,
      recommendation_steps: rsArr,
      // keep legacy strings for backward compat (join arrays if provided)
      problems:        fpArr.length > 0 ? fpArr.join("\n") : (problems || ""),
      recommendations: rsArr.length > 0 ? rsArr.join("\n") : (recommendations || ""),
      follow_up_date:  follow_up_date ? new Date(follow_up_date) : null,
      follow_up_slot:  follow_up_slot || "",
      follow_up_notes: follow_up_notes || "",
      });
    } catch (err) {
      if (followUpSession?._id) await Session.findByIdAndDelete(followUpSession._id);
      throw err;
    }

    if (followUpSession) {
      try {
        const io = getIO();
        if (io) io.emit("session-booked", { c_id, sessionId: followUpSession._id });
      } catch (_) {}
    }

    return res.status(201).json({ message: "Feedback submitted successfully", feedback, followUpSession });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "That follow-up slot is already booked" });
    }
    console.error("Error in generateFeedback:", error.message);
    res.status(500).json({ message: "Server error while submitting feedback" });
  }
};

/**
 * GET /api/feedback/student?anonymous_id=User-1234
 * Student views their own feedback reports.
 */
export const getStudentFeedback = async (req, res) => {
  try {
    const anonymous_id = req.query.anonymous_id || req.user?.anonymous_id;
    if (!anonymous_id) return res.status(400).json({ message: "Anonymous ID is required" });
    const feedbackList = await Feedback.find({ anonymous_id }).sort({ createdAt: -1 });
    return res.status(200).json({ feedback: feedbackList });
  } catch (error) {
    console.error("Error in getStudentFeedback:", error.message);
    res.status(500).json({ message: "Server error while fetching feedback" });
  }
};

/**
 * GET /api/feedback/counsellor?c_id=C001
 * Counsellor views all feedback they have submitted.
 */
export const getCounsellorFeedback = async (req, res) => {
  try {
    const c_id = req.query.c_id || req.user?.c_id;
    if (!c_id) return res.status(400).json({ message: "Counsellor ID is required" });
    const feedbackList = await Feedback.find({ c_id }).sort({ createdAt: -1 });
    return res.status(200).json({ feedback: feedbackList });
  } catch (error) {
    console.error("Error in getCounsellorFeedback:", error.message);
    res.status(500).json({ message: "Server error while fetching feedback" });
  }
};

/**
 * GET /api/feedback/all  (admin only)
 */
export const getAllFeedback = async (req, res) => {
  try {
    const feedbackList = await Feedback.find().sort({ createdAt: -1 });
    return res.status(200).json({ feedback: feedbackList });
  } catch (error) {
    console.error("Error in getAllFeedback:", error.message);
    res.status(500).json({ message: "Server error while fetching all feedback" });
  }
};

/**
 * GET /api/feedback/:id
 * Fetch a single feedback report by its Mongo _id.
 * Accessible by: the counsellor who wrote it, the student it's about,
 * or an admin.
 */
export const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);
    if (!feedback) return res.status(404).json({ message: "Feedback report not found" });

    // Authorisation: only the counsellor, the matched student, or admin can view
    const role = req.user.role;
    if (
      role !== "admin" &&
      feedback.c_id !== req.user.c_id &&
      feedback.anonymous_id !== req.user.anonymous_id
    ) {
      return res.status(403).json({ message: "Not authorised to view this report" });
    }

    return res.status(200).json({ feedback });
  } catch (err) {
    console.error("Error in getFeedbackById:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/feedback/by-session/:sessionId
 * Fetch the feedback document linked to a session.
 * Accessible by the counsellor who wrote it or an admin.
 */
export const getFeedbackBySessionId = async (req, res) => {
  try {
    const { sessionId } = req.params;
    // session_id field may hold either Mongo _id string or the roomId string
    const feedback = await Feedback.findOne({ session_id: sessionId });
    if (!feedback) return res.status(404).json({ message: "No feedback report found for this session" });

    const role = req.user.role;
    if (
      role !== "admin" &&
      feedback.c_id !== req.user.c_id &&
      feedback.anonymous_id !== req.user.anonymous_id
    ) {
      return res.status(403).json({ message: "Not authorised" });
    }

    return res.status(200).json({ feedback });
  } catch (err) {
    console.error("Error in getFeedbackBySessionId:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
