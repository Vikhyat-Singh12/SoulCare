import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  // ── Counsellor info (from JWT, never manually entered) ─────────────────
  c_id:           { type: String, required: true, trim: true },
  counsellor_name:{ type: String, required: true, trim: true },

  // ── Student info (populated from Session) ──────────────────────────────
  anonymous_id:   { type: String, required: true, trim: true },
  student_name:   { type: String, required: true, trim: true },

  // ── Session reference ───────────────────────────────────────────────────
  session_id:     { type: String, default: "" },
  session_type:   { type: String, enum: ["video","voice","chat",""], default: "" },
  date:           { type: Date, default: Date.now },
  slot:           { type: String, default: "" },

  // ── Clinical assessment ─────────────────────────────────────────────────
  status: {
    type: String,
    enum: ["improved","needs-support","stable","crisis"],
    default: "stable",
  },
  mood_rating: { type: Number, min: 1, max: 5, default: null },
  risk_level:  { type: String, enum: ["low","moderate","high",""], default: "low" },

  // ── Point-wise feedback (arrays, 1-10 bullets each) ─────────────────────
  problems:             { type: String,   trim: true, default: "" }, // legacy
  feedback_points:      { type: [String], default: [] },             // NEW
  recommendations:      { type: String,   trim: true, default: "" }, // legacy
  recommendation_steps: { type: [String], default: [] },             // NEW

  // ── Follow-up ───────────────────────────────────────────────────────────
  follow_up_date:  { type: Date,   default: null },
  follow_up_slot:  { type: String, trim: true, default: "" },
  follow_up_notes: { type: String, trim: true, default: "" },

}, { timestamps: true });

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
