import crypto from "crypto";
import Session from "../models/session.model.js";
import User from "../models/user.model.js";
import { getIO } from "../socket/socket.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

const generateMeetingData = () => {
  const roomId = crypto.randomBytes(8).toString("hex");
  const domain = "https://jitsi.riot.im";
  return {
    meetingLink: `${domain}/SoulCare-${roomId}`,
    roomName: `SoulCare-${roomId}`,
    roomId,
  };
};

/**
 * Generate all 30-minute slots between startHour:startMin and endHour:endMin.
 * Returns strings like "10:00 AM", "10:30 AM", "01:00 PM", etc.
 */
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

/**
 * Parse a slot string like "10:30 AM" into a Date object on the given date string.
 * dateStr should be "YYYY-MM-DD".
 */
function slotToDate(dateStr, slotStr) {
  const [timePart, period] = slotStr.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  // Build the date in local time so it matches how dates are stored
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * GET /api/session/available-slots?c_id=C001&date=2024-07-20
 * Returns the list of 30-min slots that are:
 *   1. Not already booked by another student (active booking exists)
 *   2. Not in the past (for today's date only)
 */
export const getAvailableSlots = async (req, res) => {
  try {
    const { c_id, date } = req.query;

    if (!c_id || !date) {
      return res.status(400).json({ message: "c_id and date are required" });
    }

    // Validate date is not before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(date + "T00:00:00");
    requestedDate.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return res.status(400).json({ message: "Cannot book sessions for past dates" });
    }

    // Get already-booked slots for this counsellor on this date
    const bookedSessions = await Session.find({
      c_id,
      date: {
        $gte: new Date(date + "T00:00:00.000Z"),
        $lt: new Date(date + "T23:59:59.999Z"),
      },
      status: { $in: ["pending", "upcoming"] },
    }).select("slot");

    const bookedSlots = new Set(bookedSessions.map((s) => s.slot));

    // Generate all possible slots for the day (10:00 AM to 4:30 PM)
    const allSlots = generateAllSlots(10, 0, 17, 0);

    const now = new Date();
    const isToday = requestedDate.getTime() === today.getTime();

    // Filter: remove booked and (for today) past slots
    const availableSlots = allSlots.filter((slot) => {
      if (bookedSlots.has(slot)) return false;
      if (isToday) {
        const slotTime = slotToDate(date, slot);
        if (slotTime <= now) return false;
      }
      return true;
    });

    return res.status(200).json({ availableSlots, date, c_id });
  } catch (err) {
    console.error("Error in getAvailableSlots:", err.message);
    res.status(500).json({ message: "Server error while fetching available slots" });
  }
};

/**
 * POST /api/session/create-room
 * Student books a session. Requires student auth via middleware.
 */
export const bookSession = async (req, res) => {
  try {
    const { c_id, c_name, slot, date, session_type } = req.body;

    // anonymous_id and _id come from the authenticated student's JWT
    const anonymous_id = req.user.anonymous_id;
    const student_id = req.user._id;

    if (!c_id || !c_name || !slot || !date) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    if (!anonymous_id) {
      return res.status(400).json({
        message: "Student anonymous ID not found. Please complete your profile.",
      });
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(date + "T00:00:00");
    requestedDate.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return res.status(400).json({ message: "Cannot book sessions for past dates" });
    }

    // Validate slot time is not in the past (for today's date)
    const isToday = requestedDate.getTime() === today.getTime();
    if (isToday) {
      const slotTime = slotToDate(date, slot);
      if (slotTime <= new Date()) {
        return res.status(400).json({
          message: "This time slot has already passed. Please choose a future slot.",
        });
      }
    }

    // Check for duplicate booking (slot conflict)
    const conflict = await Session.findOne({
      c_id,
      date: {
        $gte: new Date(date + "T00:00:00.000Z"),
        $lt: new Date(date + "T23:59:59.999Z"),
      },
      slot,
      status: { $in: ["pending", "upcoming"] },
    });

    if (conflict) {
      return res.status(409).json({
        message: "This slot is already booked. Please choose a different time.",
      });
    }

    const meetingData = generateMeetingData();

    const session = await Session.create({
      c_id,
      c_name,
      anonymous_id,
      student_id,
      slot,
      date: new Date(date),
      session_id: meetingData.roomId,
      session_link: meetingData.meetingLink,
      status: "upcoming",
      session_type: session_type || "video",
    });

    // Emit real-time update so the counsellor dashboard refreshes instantly
    try {
      const io = getIO();
      if (io) io.emit("session-booked", { c_id, sessionId: session._id });
    } catch (_) { /* socket might not be initialised yet in tests */ }

    return res.status(201).json({
      message: "Session booked successfully",
      session,
    });
  } catch (err) {
    // MongoDB duplicate key error (compound index backup)
    if (err.code === 11000) {
      return res.status(409).json({
        message: "This slot is already booked. Please choose a different time.",
      });
    }
    console.error("Error in bookSession:", err.message);
    res.status(500).json({ message: "Server error while booking session" });
  }
};

/**
 * DELETE /api/session/:id
 * Student cancels their own upcoming session.
 */
export const cancelSession = async (req, res) => {
  try {
    const { id } = req.params;
    const anonymous_id = req.user.anonymous_id;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Only the student who booked can cancel
    if (session.anonymous_id !== anonymous_id) {
      return res.status(403).json({ message: "You can only cancel your own sessions" });
    }

    // Can only cancel upcoming sessions
    if (session.status !== "upcoming") {
      return res.status(400).json({
        message: "Only upcoming sessions can be cancelled",
      });
    }

    // Prevent cancelling past sessions
    const now = new Date();
    const slotTime = slotToDate(session.date.toISOString().split("T")[0], session.slot);
    if (slotTime <= now) {
      return res.status(400).json({
        message: "Cannot cancel a session that has already started or passed",
      });
    }

    session.status = "cancelled";
    await session.save();

    return res.status(200).json({
      message: "Session cancelled successfully",
      session,
    });
  } catch (err) {
    console.error("Error in cancelSession:", err.message);
    res.status(500).json({ message: "Server error while cancelling session" });
  }
};

/**
 * GET /api/session/counsellor?c_id=C001
 * Counsellor fetches their sessions with student name populated.
 */
export const getCounsellorSessions = async (req, res) => {
  try {
    const c_id = req.query.c_id || req.user?.c_id;

    if (!c_id) {
      return res.status(400).json({ message: "Counsellor ID is required" });
    }

    const sessions = await Session.find({ c_id })
      .select("anonymous_id c_id c_name slot date session_link session_id status session_type counsellor_feedback feedback_submitted_at student_id createdAt")
      .populate("student_id", "name email")
      .sort({ date: 1 });

    const sanitized = sessions.map((s) => ({
      _id: s._id,
      anonymous_id: s.anonymous_id,
      student_name: s.student_id?.name || null,
      student_email: s.student_id?.email || null,
      c_id: s.c_id,
      c_name: s.c_name,
      slot: s.slot,
      date: s.date,
      session_link: s.session_link,
      session_id: s.session_id,
      status: s.status,
      session_type: s.session_type || 'video',
      counsellor_feedback: s.counsellor_feedback || null,
      feedback_submitted_at: s.feedback_submitted_at || null,
      createdAt: s.createdAt,
    }));

    return res.status(200).json({ sessions: sanitized });
  } catch (err) {
    console.error("Error in getCounsellorSessions:", err.message);
    res.status(500).json({ message: "Server error while fetching sessions" });
  }
};

/**
 * PATCH /api/session/:id/feedback
 * Counsellor submits a feedback/report for a completed session.
 */
export const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const counsellorId = req.user?.c_id;

    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ message: "Feedback text is required." });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    // Ensure only the assigned counsellor can submit feedback
    if (session.c_id !== counsellorId) {
      return res.status(403).json({ message: "Not authorized to submit feedback for this session." });
    }

    session.counsellor_feedback = feedback.trim();
    session.feedback_submitted_at = new Date();
    await session.save();

    return res.status(200).json({
      message: "Feedback submitted successfully.",
      counsellor_feedback: session.counsellor_feedback,
      feedback_submitted_at: session.feedback_submitted_at,
    });
  } catch (err) {
    console.error("Error in submitFeedback:", err.message);
    res.status(500).json({ message: "Server error while submitting feedback" });
  }
};



/**
 * GET /api/session/student
 * Student fetches their own sessions, categorized and sorted:
 *   - upcomingSessions: status=upcoming, sorted by nearest date+slot first
 *   - previousSessions: status=completed|cancelled, sorted by most recent first
 */
export const getStudentSessions = async (req, res) => {
  try {
    const anonymous_id = req.query.anonymous_id || req.user?.anonymous_id;

    if (!anonymous_id) {
      return res.status(400).json({ message: "Anonymous ID is required" });
    }

    const allSessions = await Session.find({ anonymous_id });

    const now = new Date();

    // Categorize
    const upcomingRaw = allSessions.filter(
      (s) => s.status === "upcoming" || s.status === "pending"
    );
    const previousRaw = allSessions.filter(
      (s) => s.status === "completed" || s.status === "cancelled"
    );

    // Sort upcoming: nearest first (combine date + slot into a timestamp)
    upcomingRaw.sort((a, b) => {
      const aTime = slotToDate(a.date.toISOString().split("T")[0], a.slot).getTime();
      const bTime = slotToDate(b.date.toISOString().split("T")[0], b.slot).getTime();
      return aTime - bTime;
    });

    // Sort previous: most recent first
    previousRaw.sort((a, b) => {
      const aTime = slotToDate(a.date.toISOString().split("T")[0], a.slot).getTime();
      const bTime = slotToDate(b.date.toISOString().split("T")[0], b.slot).getTime();
      return bTime - aTime;
    });

    // Normalize session_type for legacy sessions (created before the field was added)
    const normalize = (s) => {
      const obj = s.toObject();
      if (!obj.session_type) obj.session_type = 'video';
      return obj;
    };

    return res.status(200).json({
      upcomingSessions: upcomingRaw.map(normalize),
      previousSessions: previousRaw.map(normalize),
    });
  } catch (err) {
    console.error("Error in getStudentSessions:", err.message);
    res.status(500).json({ message: "Server error while fetching sessions" });
  }
};

/**
 * GET /api/session/all
 * Admin fetches ALL sessions with full student details, grouped by counsellor.
 * ADMIN ONLY — full student PII returned here.
 */
export const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate({
        path: "student_id",
        select: "name rollNo stream academicYear mobile anonymous_id email",
      })
      .sort({ date: -1 });

    // Group by counsellor
    const grouped = {};
    sessions.forEach((s) => {
      if (!grouped[s.c_id]) {
        grouped[s.c_id] = {
          c_id: s.c_id,
          c_name: s.c_name,
          sessions: [],
        };
      }
      grouped[s.c_id].sessions.push({
        _id: s._id,
        student_name: s.student_id?.name || "N/A",
        anonymous_id: s.anonymous_id,
        rollNo: s.student_id?.rollNo || "N/A",
        stream: s.student_id?.stream || "N/A",
        academicYear: s.student_id?.academicYear || "N/A",
        mobile: s.student_id?.mobile || "N/A",
        email: s.student_id?.email || "N/A",
        slot: s.slot,
        date: s.date,
        session_link: s.session_link,
        session_id: s.session_id,
        status: s.status,
        createdAt: s.createdAt,
      });
    });

    return res.status(200).json({
      sessions,
      grouped: Object.values(grouped),
    });
  } catch (err) {
    console.error("Error in getAllSessions:", err.message);
    res.status(500).json({ message: "Server error while fetching all sessions" });
  }
};

/**
 * PATCH /api/session/:id/status
 * Counsellor or admin updates session status.
 */
export const updateSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "upcoming", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const session = await Session.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!session) return res.status(404).json({ message: "Session not found" });

    return res.status(200).json({ message: "Session status updated", session });
  } catch (err) {
    console.error("Error in updateSessionStatus:", err.message);
    res.status(500).json({ message: "Server error while updating session status" });
  }
};

/**
 * GET /api/session/turn-credentials
 * Returns ICE server config for WebRTC.
 * Uses free OpenRelay TURN by default; override with env vars for production.
 */
export const getTurnCredentials = (req, res) => {
  try {
    const iceServers = [
      // Google public STUN
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      // Free OpenRelay TURN (no account needed, ~1GB/month free)
      {
        urls: process.env.TURN_URL || "turn:openrelay.metered.ca:80",
        username: process.env.TURN_USERNAME || "openrelayproject",
        credential: process.env.TURN_CREDENTIAL || "openrelayproject",
      },
      {
        urls: process.env.TURN_URL_TLS || "turn:openrelay.metered.ca:443",
        username: process.env.TURN_USERNAME || "openrelayproject",
        credential: process.env.TURN_CREDENTIAL || "openrelayproject",
      },
      {
        urls: process.env.TURN_URL_TCP || "turn:openrelay.metered.ca:443?transport=tcp",
        username: process.env.TURN_USERNAME || "openrelayproject",
        credential: process.env.TURN_CREDENTIAL || "openrelayproject",
      },
    ];

    return res.status(200).json({ iceServers });
  } catch (err) {
    console.error("Error in getTurnCredentials:", err.message);
    res.status(500).json({ message: "Server error fetching TURN credentials" });
  }
};

/**
 * GET /api/session/info/:roomName
 * Secure endpoint: returns session details only to the booked student or matched counsellor.
 * Used by LiveSession.jsx to fetch session_type without exposing it in the URL.
 */
export const getSessionInfo = async (req, res) => {
  try {
    const { roomName } = req.params;
    const requestingUser = req.user;

    // The URL uses the last segment of session_link (e.g. "SoulCare-abc123").
    // Match against session_link which ends with that value.
    const session = await Session.findOne({
      session_link: { $regex: roomName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$' },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    // ── Authorization check ───────────────────────────────────────────────────
    const isStudent    = requestingUser.role === "student" &&
                         session.student_id?.toString() === requestingUser._id?.toString();
    const isCounsellor = requestingUser.role === "counsellor" &&
                         session.c_id === requestingUser.c_id;
    const isAdmin      = requestingUser.role === "admin";

    if (!isStudent && !isCounsellor && !isAdmin) {
      return res.status(403).json({
        message: "Access denied. You are not a participant in this session.",
      });
    }

    // Normalize session_type for legacy sessions
    const session_type = session.session_type || "video";

    return res.status(200).json({
      session_type,
      c_name:  session.c_name,
      slot:    session.slot,
      date:    session.date,
      status:  session.status,
      authorized: true,
    });
  } catch (err) {
    console.error("Error in getSessionInfo:", err.message);
    res.status(500).json({ message: "Server error fetching session info" });
  }
};
/**
 * POST /api/session/book-followup
 * Counsellor books a follow-up session on behalf of the student.
 * Uses the same student + counsellor info from the original session.
 * Body: { original_session_id, date, slot }
 */
export const bookFollowUpSession = async (req, res) => {
  try {
    const { original_session_id, date, slot } = req.body;
    const c_id = req.user.c_id;

    if (!original_session_id || !date || !slot) {
      return res.status(400).json({ message: "original_session_id, date, and slot are required" });
    }

    // Load original session to inherit student info + session type
    const original = await Session.findById(original_session_id);
    if (!original) return res.status(404).json({ message: "Original session not found" });
    if (original.c_id !== c_id) return res.status(403).json({ message: "Not authorised" });

    // Validate date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reqDate = new Date(date + "T00:00:00");
    reqDate.setHours(0, 0, 0, 0);
    if (reqDate < today) return res.status(400).json({ message: "Cannot book sessions for past dates" });

    if (!generateAllSlots().includes(slot)) {
      return res.status(400).json({ message: "Invalid follow-up slot selected" });
    }

    const slotTime = slotToDate(date, slot);
    if (reqDate.getTime() === today.getTime() && slotTime <= new Date()) {
      return res.status(400).json({ message: "This follow-up slot has already passed" });
    }

    // Slot conflict check
    const conflict = await Session.findOne({
      c_id,
      date: { $gte: new Date(date + "T00:00:00.000Z"), $lt: new Date(date + "T23:59:59.999Z") },
      slot,
      status: { $in: ["pending", "upcoming"] },
    });
    if (conflict) return res.status(409).json({ message: "That slot is already booked for this counsellor." });

    const meetingData = generateMeetingData();

    const session = await Session.create({
      c_id:         original.c_id,
      c_name:       original.c_name,
      anonymous_id: original.anonymous_id,
      student_id:   original.student_id,
      slot,
      date:         new Date(date),
      session_id:   meetingData.roomId,
      session_link: meetingData.meetingLink,
      status:       "upcoming",
      session_type: original.session_type,   // inherit same type
    });

    try {
      const io = getIO();
      if (io) io.emit("session-booked", { c_id, sessionId: session._id });
    } catch (_) {}

    return res.status(201).json({ message: "Follow-up session booked", session });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "That slot is already booked." });
    console.error("Error in bookFollowUpSession:", err.message);
    res.status(500).json({ message: "Server error while booking follow-up session" });
  }
};
