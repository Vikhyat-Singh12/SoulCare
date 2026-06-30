import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    // Counsellor identifiers
    c_id: {
        type: String,
        required: true,
        trim: true,
    },
    c_name: {
        type: String,
        required: true,
        trim: true,
    },

    // Student identifier (privacy-preserving — counsellor only ever sees this)
    anonymous_id: {
        type: String,
        required: true,
        trim: true,
    },

    // Full student ObjectId — for admin joins only, NEVER sent to counsellors
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // Session identifiers
    session_id: {
        type: String,
        required: true,
        unique: true,
    },
    session_link: {
        type: String,
        required: true,
        unique: true,
    },

    // Appointment details
    // slot stores the raw time string e.g. "10:30 AM"
    slot: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },

    // Session lifecycle status
    status: {
        type: String,
        enum: ['pending', 'upcoming', 'completed', 'cancelled'],
        default: 'upcoming',
    },

    // Session modality chosen by student at booking time
    session_type: {
        type: String,
        enum: ['video', 'voice', 'chat'],
        default: 'video',
    },

    // Counsellor's post-session feedback/report for the student
    counsellor_feedback: {
        type: String,
        default: null,
    },
    feedback_submitted_at: {
        type: Date,
        default: null,
    },

}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────────────────────────────

// Compound unique index: prevents two students booking the same counsellor
// at the same slot on the same date. Partial filter allows re-booking after cancel.
sessionSchema.index(
    { c_id: 1, date: 1, slot: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ['pending', 'upcoming'] } },
    }
);

// Performance indexes for student and counsellor queries
sessionSchema.index({ anonymous_id: 1, date: -1 });
sessionSchema.index({ c_id: 1, date: 1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;