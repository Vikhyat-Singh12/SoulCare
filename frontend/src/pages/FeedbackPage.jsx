import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  User, Calendar, Clock, Save, AlertCircle, CheckCircle,
  FileText, Activity, Plus, Trash2, ChevronLeft, Loader2,
  Heart, Brain, TrendingUp, Info, Star, Flag, CalendarPlus,
} from "lucide-react";
import { useFeedbackStore } from "../stores/useFeedbackStore";
import { useAuthStore } from "../stores/useAuthStore";
import axios from "../lib/axios";

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_TYPE_LABELS = { video: "Video Call", voice: "Voice Call", chat: "Text Chat" };

const STATUS_OPTIONS = [
  { value: "improved",      label: "Improved",        color: "bg-green-100 text-green-700 border-green-200",   dot: "bg-green-500"  },
  { value: "stable",        label: "Neutral / Stable", color: "bg-blue-100 text-blue-700 border-blue-200",     dot: "bg-blue-500"   },
  { value: "needs-support", label: "Needs Support",   color: "bg-amber-100 text-amber-700 border-amber-200",   dot: "bg-amber-500"  },
  { value: "crisis",        label: "Crisis",           color: "bg-red-100 text-red-700 border-red-200",         dot: "bg-red-500"    },
];

const RISK_OPTIONS = [
  { value: "low",      label: "Low Risk",      color: "text-green-600 bg-green-50 border-green-200"  },
  { value: "moderate", label: "Moderate Risk", color: "text-amber-600 bg-amber-50 border-amber-200"  },
  { value: "high",     label: "High Risk",     color: "text-red-600 bg-red-50 border-red-200"        },
];

const MOOD_EMOJI = ["", "😟", "😕", "😐", "🙂", "😄"];
const MOOD_LABEL = ["", "Very Low", "Low", "Neutral", "Good", "Excellent"];
const MOOD_COLOR = ["", "text-red-500", "text-orange-400", "text-yellow-500", "text-green-500", "text-emerald-500"];

// ── PointList Component ───────────────────────────────────────────────────────
function PointList({ label, icon: Icon, color, points, onChange, placeholder, maxPoints = 10, required = false, error }) {
  const addPoint = () => { if (points.length < maxPoints) onChange([...points, ""]); };
  const update = (idx, val) => { const u = [...points]; u[idx] = val; onChange(u); };
  const remove = (idx) => onChange(points.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          {React.createElement(Icon, { className: `w-4 h-4 ${color}` })}
          {label}
          {required && <span className="text-red-500">*</span>}
          <span className="text-xs font-normal text-gray-400">({points.length}/{maxPoints})</span>
        </label>
        {points.length < maxPoints && (
          <button type="button" onClick={addPoint}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition">
            <Plus className="w-3 h-3" /> Add Point
          </button>
        )}
      </div>

      {points.length === 0 && (
        <button type="button" onClick={addPoint}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />Click to add your first point
        </button>
      )}

      <div className="space-y-2.5">
        {points.map((pt, idx) => (
          <div key={idx} className="flex items-start gap-2.5">
            <div className="flex-shrink-0 w-6 h-6 mt-2.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              {idx + 1}
            </div>
            <textarea value={pt} onChange={(e) => update(idx, e.target.value)}
              placeholder={`${placeholder} (point ${idx + 1})`} rows={2}
              className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/80 transition placeholder:text-gray-300" />
            <button type="button" onClick={() => remove(idx)} title="Remove"
              className="flex-shrink-0 mt-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const FeedbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const { submitFeedback, isSubmitting } = useFeedbackStore();
  const { user } = useAuthStore();

  // ── State ───────────────────────────────────────────────────────────────────
  const [sessionInfo, setSessionInfo]             = useState(null);
  const [loadingSession, setLoadingSession]       = useState(false);
  const [sessionError, setSessionError]           = useState(null);
  const [availableSlots, setAvailableSlots]       = useState([]);
  const [loadingSlots, setLoadingSlots]           = useState(false);
  const [slotsError, setSlotsError]               = useState("");
  const [showSuccess, setShowSuccess]             = useState(false);
  const [errors, setErrors]                       = useState({});

  const [form, setForm] = useState({
    student_name:         "",
    date:                 "",
    slot:                 "",
    session_type:         "",
    status:               "stable",
    mood_rating:          null,
    risk_level:           "low",
    feedback_points:      [""],
    recommendation_steps: [""],
    follow_up_date:       "",
    follow_up_slot:       "",
    follow_up_notes:      "",
  });

  // ── Fetch session info ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      setLoadingSession(true);
      setSessionError(null);
      try {
        const { data } = await axios.get(`/feedback/session-info/${sessionId}`);
        setSessionInfo(data);
        setForm((prev) => ({
          ...prev,
          student_name: data.student_name || "",
          date:         data.date ? new Date(data.date).toISOString().split("T")[0] : "",
          slot:         data.slot         || "",
          session_type: data.session_type || "",
        }));
      } catch (err) {
        setSessionError(err.response?.data?.message || "Could not load session details.");
      } finally {
        setLoadingSession(false);
      }
    })();
  }, [sessionId]);

  // ── Fetch available slots when follow-up date changes ───────────────────────
  useEffect(() => {
    if (!form.follow_up_date || !sessionInfo?.c_id) {
      setAvailableSlots([]);
      setSlotsError("");
      return;
    }
    (async () => {
      setLoadingSlots(true);
      setSlotsError("");
      try {
        const { data } = await axios.get("/session/available-slots", {
          params: { c_id: sessionInfo.c_id, date: form.follow_up_date },
        });
        setAvailableSlots(data.availableSlots || []);
      } catch (err) {
        setAvailableSlots([]);
        setSlotsError(err.response?.data?.message || "Could not load available slots. Please choose another date.");
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, [form.follow_up_date, sessionInfo?.c_id]);

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.student_name.trim()) errs.student_name = "Student name is required";
    if (!form.date) errs.date = "Session date is required";
    if (form.feedback_points.filter((p) => p.trim()).length === 0)
      errs.feedback_points = "Add at least one session feedback point";
    if (form.recommendation_steps.filter((p) => p.trim()).length === 0)
      errs.recommendation_steps = "Add at least one recommendation step";
    if (form.follow_up_date && !form.follow_up_slot)
      errs.follow_up_slot = "Please select a time slot for the follow-up session";
    if (form.follow_up_date && form.follow_up_slot && !availableSlots.includes(form.follow_up_slot))
      errs.follow_up_slot = "This follow-up slot is no longer available";
    return errs;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const payload = {
      anonymous_id:         sessionInfo?.anonymous_id || "unknown",
      student_name:         form.student_name,
      session_id:           sessionId || sessionInfo?.session_id || "",
      session_type:         form.session_type,
      date:                 form.date,
      slot:                 form.slot,
      status:               form.status,
      mood_rating:          form.mood_rating,
      risk_level:           form.risk_level,
      feedback_points:      form.feedback_points.filter((p) => p.trim()),
      recommendation_steps: form.recommendation_steps.filter((p) => p.trim()),
      follow_up_date:       form.follow_up_date || null,
      follow_up_slot:       form.follow_up_slot || "",
      follow_up_notes:      form.follow_up_notes,
    };

    const result = await submitFeedback(payload);
    if (!result) return;

    // ── FIX #1: Stamp session record so dashboard shows "Report given" ──────
    if (sessionId) {
      try {
        await axios.patch(`/session/${sessionId}/feedback`, {
          feedback: form.feedback_points.filter((p) => p.trim()).join("\n"),
        });
      } catch { /* non-critical */ }
    }

    setShowSuccess(true);
    setTimeout(() => navigate("/counsellor-dashboard"), 2800);
  };

  const clearFollowUp = () => {
    setForm((p) => ({
      ...p,
      follow_up_date: "",
      follow_up_slot: "",
      follow_up_notes: "",
    }));
    setAvailableSlots([]);
    setSlotsError("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.follow_up_slot;
      return next;
    });
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const fieldClass = (err) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white/80 transition placeholder:text-gray-300 ${
      err ? "border-red-300 focus:ring-red-300" : "border-gray-200 focus:ring-blue-400"
    }`;
  const autoFilled = "w-full px-4 py-3 border border-blue-100 rounded-xl text-sm bg-blue-50/60 text-gray-700 font-medium cursor-default";

  // ── Success Screen ───────────────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full opacity-40 -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-indigo-100 to-indigo-200 rounded-full opacity-35 translate-y-1/3" />
        </div>
        <div className="relative text-center p-10 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-green-100 max-w-sm mx-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Report Saved!</h2>
          <p className="text-gray-500 text-sm">
            Session feedback submitted successfully.{form.follow_up_date && form.follow_up_slot ? " Follow-up session booked." : ""}
          </p>
          <p className="text-xs text-gray-400 mt-2">Redirecting to dashboard…</p>
          <div className="mt-5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{ animation: "grow 2.8s linear forwards" }} />
          </div>
        </div>
        <style>{`@keyframes grow { from { width: 0% } to { width: 100% } }`}</style>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-blue-400 rounded-full opacity-40 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-sky-100 to-sky-400 rounded-full opacity-30 -translate-x-1/2" />
        <div className="absolute bottom-0 right-3/4 w-72 h-72 bg-gradient-to-tr from-indigo-100 to-indigo-400 rounded-full opacity-35 translate-y-1/3" />
        <div className="absolute bottom-1/3 left-3/4 w-64 h-64 bg-gradient-to-bl from-cyan-100 to-cyan-400 rounded-full opacity-30" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-200">
              <FileText className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Session Feedback Report
          </h1>
          <p className="text-gray-500">Document counselling sessions and track student progress</p>
        </div>

        {/* Banners */}
        {loadingSession && (
          <div className="mb-5 flex items-center gap-3 px-5 py-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />Loading session details…
          </div>
        )}
        {sessionError && (
          <div className="mb-5 flex items-center gap-3 px-5 py-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{sessionError}
          </div>
        )}
        {Object.keys(errors).length > 0 && (
          <div className="mb-5 px-5 py-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
              <AlertCircle className="w-4 h-4" />Please fix the following before submitting:
            </div>
            <ul className="list-disc list-inside space-y-0.5">
              {Object.values(errors).map((e, i) => <li key={i} className="text-sm text-red-600">{e}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── 1. Session Details (auto-filled) ─────────────────────────── */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-50 rounded-xl"><Info className="w-4 h-4 text-blue-600" /></div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Session Details</h2>
                <p className="text-xs text-gray-400">Auto-filled from your booking record</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />Student Name <span className="text-red-400">*</span>
                </label>
                {sessionInfo
                  ? <div className={autoFilled}>{form.student_name}</div>
                  : <input type="text" value={form.student_name}
                      onChange={(e) => setForm((p) => ({ ...p, student_name: e.target.value }))}
                      placeholder="Enter student name" className={fieldClass(errors.student_name)} />}
                {errors.student_name && <p className="text-xs text-red-500">{errors.student_name}</p>}
              </div>

              {/* Counsellor */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />Counsellor
                </label>
                <div className={autoFilled}>Dr. {user?.name || "—"}</div>
              </div>

              {/* Session Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />Session Date <span className="text-red-400">*</span>
                </label>
                {sessionInfo
                  ? <div className={autoFilled}>{form.date ? new Date(form.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}</div>
                  : <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className={fieldClass(errors.date)} />}
                {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
              </div>

              {/* Slot */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />Time Slot
                </label>
                <div className={autoFilled}>{form.slot || "—"}</div>
              </div>

              {/* Session Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />Session Type
                </label>
                <div className={autoFilled}>{SESSION_TYPE_LABELS[form.session_type] || form.session_type || "—"}</div>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />Duration
                </label>
                <div className={autoFilled}>30 minutes</div>
              </div>
            </div>
          </div>

          {/* ── 2. Clinical Assessment ───────────────────────────────────── */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-purple-50 rounded-xl"><Brain className="w-4 h-4 text-purple-600" /></div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Clinical Assessment</h2>
                <p className="text-xs text-gray-400">Your professional evaluation of the student's current state</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Status */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5 block">Student Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setForm((p) => ({ ...p, status: opt.value }))}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition flex items-center gap-2 ${
                        form.status === opt.value ? opt.color + " shadow-sm" : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"
                      }`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${form.status === opt.value ? opt.dot : "bg-gray-300"}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Mood Rating */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" />Student Mood (1–5)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button"
                        onClick={() => setForm((p) => ({ ...p, mood_rating: p.mood_rating === n ? null : n }))}
                        className={`flex-1 py-2.5 rounded-xl border text-xl transition ${form.mood_rating === n ? "border-blue-300 bg-blue-50 shadow-sm scale-105" : "border-gray-200 bg-white hover:border-gray-300"}`}
                        title={MOOD_LABEL[n]}>
                        <span className={`block text-center ${form.mood_rating === n ? MOOD_COLOR[n] : "grayscale opacity-60"}`}>{MOOD_EMOJI[n]}</span>
                        <span className="block text-center text-[10px] font-semibold text-gray-400 mt-0.5">{n}</span>
                      </button>
                    ))}
                  </div>
                  {form.mood_rating && (
                    <p className={`text-xs mt-1.5 font-medium ${MOOD_COLOR[form.mood_rating]}`}>
                      {MOOD_EMOJI[form.mood_rating]} {MOOD_LABEL[form.mood_rating]}
                    </p>
                  )}
                </div>

                {/* Risk Level */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5" />Risk Level
                  </label>
                  <div className="flex gap-2">
                    {RISK_OPTIONS.map((r) => (
                      <button key={r.value} type="button" onClick={() => setForm((p) => ({ ...p, risk_level: r.value }))}
                        className={`flex-1 px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${
                          form.risk_level === r.value ? r.color + " shadow-sm" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                        }`}>{r.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. Session Feedback (point-wise) ────────────────────────── */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-blue-50 rounded-xl"><FileText className="w-4 h-4 text-blue-600" /></div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Session Feedback</h2>
                <p className="text-xs text-gray-400">Key observations, insights, and behaviour notes — up to 10 points</p>
              </div>
            </div>
            <PointList
              label="Session Observations & Insights" icon={FileText} color="text-blue-600"
              points={form.feedback_points}
              onChange={(pts) => setForm((p) => ({ ...p, feedback_points: pts }))}
              placeholder="E.g., Student showed progress in managing anxiety triggers"
              required error={errors.feedback_points} />
          </div>

          {/* ── 4. Recommendations (point-wise) ─────────────────────────── */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-green-50 rounded-xl"><TrendingUp className="w-4 h-4 text-green-600" /></div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Recommendations & Next Steps</h2>
                <p className="text-xs text-gray-400">Concrete action items, resources, or interventions — up to 10 points</p>
              </div>
            </div>
            <PointList
              label="Recommended Actions" icon={TrendingUp} color="text-green-600"
              points={form.recommendation_steps}
              onChange={(pts) => setForm((p) => ({ ...p, recommendation_steps: pts }))}
              placeholder="E.g., Practice mindful breathing for 5 min each morning"
              required error={errors.recommendation_steps} />
          </div>

          {/* ── 5. Follow-up Session ─────────────────────────────────────── */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-amber-50 rounded-xl"><CalendarPlus className="w-4 h-4 text-amber-600" /></div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900">Follow-up Session</h2>
                <p className="text-xs text-gray-400">
                  Optional — schedule the next session. It will be booked with the same session type ({SESSION_TYPE_LABELS[form.session_type] || "—"}) and 30 min duration.
                </p>
              </div>
              {(form.follow_up_date || form.follow_up_slot || form.follow_up_notes) && (
                <button
                  type="button"
                  onClick={clearFollowUp}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />Clear follow-up
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Follow-up Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />Follow-up Date
                </label>
                <input type="date" value={form.follow_up_date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, follow_up_date: e.target.value, follow_up_slot: "" }));
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.follow_up_slot;
                      return next;
                    });
                  }}
                  className={fieldClass()} />
              </div>

              {/* Follow-up Time Slot */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />Follow-up Time Slot
                  {form.follow_up_date && <span className="text-red-400">*</span>}
                </label>
                {!form.follow_up_date ? (
                  <div className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed">
                    Select a date first
                  </div>
                ) : loadingSlots ? (
                  <div className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />Loading available slots…
                  </div>
                ) : slotsError ? (
                  <div className="px-4 py-3 border border-red-100 rounded-xl text-sm bg-red-50 text-red-600">
                    {slotsError}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="px-4 py-3 border border-amber-100 rounded-xl text-sm bg-amber-50 text-amber-700">
                    No available slots for this date.
                  </div>
                ) : (
                  <select value={form.follow_up_slot}
                    onChange={(e) => setForm((p) => ({ ...p, follow_up_slot: e.target.value }))}
                    className={fieldClass(errors.follow_up_slot)}>
                    <option value="">— Select a slot —</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                )}
                {errors.follow_up_slot && <p className="text-xs text-red-500">{errors.follow_up_slot}</p>}
                {form.follow_up_slot && (
                  <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Follow-up will be booked: {form.follow_up_date} at {form.follow_up_slot} · 30 min · {SESSION_TYPE_LABELS[form.session_type] || "Same type"}
                  </p>
                )}
              </div>

              {/* Follow-up Notes */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Follow-up Notes (optional)</label>
                <textarea value={form.follow_up_notes}
                  onChange={(e) => setForm((p) => ({ ...p, follow_up_notes: e.target.value }))}
                  placeholder="Notes for the next session or interim check-in..."
                  rows={3} className={fieldClass() + " resize-none"} />
              </div>
            </div>
          </div>

          {/* ── Submit ────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 pb-8">
            <button type="button" onClick={() => navigate(-1)}
              className="sm:w-40 px-6 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-base hover:shadow-xl hover:shadow-blue-200/60 transition-all transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
              {isSubmitting
                ? <><Loader2 className="w-5 h-5 animate-spin" />Saving Report…</>
                : <><Save className="w-5 h-5" />Save Session Report</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage;
