import React, { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FileText, User, Calendar, Clock, Activity, ChevronLeft,
  CheckCircle, AlertTriangle, Heart, Brain, TrendingUp, Flag,
  Star, Loader2, AlertCircle, CalendarClock, MessageSquare,
} from "lucide-react";
import { useFeedbackStore } from "../stores/useFeedbackStore";
import { useAuthStore } from "../stores/useAuthStore";

// ── Helpers ───────────────────────────────────────────────────────────────────

const SESSION_TYPE_LABELS = { video: "Video Call", voice: "Voice Call", chat: "Text Chat" };

const MOOD_EMOJI = ["", "😟", "😕", "😐", "🙂", "😄"];
const MOOD_LABEL = ["", "Very Low", "Low", "Neutral", "Good", "Excellent"];
const MOOD_COLOR = ["", "text-red-500", "text-orange-400", "text-yellow-500", "text-green-500", "text-emerald-500"];
const MOOD_BG    = ["", "bg-red-50",   "bg-orange-50",  "bg-yellow-50",  "bg-green-50",  "bg-emerald-50"];

const STATUS_META = {
  improved:        { label: "Improved",        color: "text-green-700", bg: "bg-green-100", border: "border-green-200", icon: CheckCircle },
  stable:          { label: "Neutral / Stable", color: "text-blue-700",  bg: "bg-blue-100",  border: "border-blue-200",  icon: Activity     },
  "needs-support": { label: "Needs Support",   color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200", icon: AlertTriangle },
  crisis:          { label: "Crisis",           color: "text-red-700",   bg: "bg-red-100",   border: "border-red-200",   icon: AlertTriangle },
};

const RISK_META = {
  low:      { label: "Low Risk",      color: "text-green-700", bg: "bg-green-50",  border: "border-green-200" },
  moderate: { label: "Moderate Risk", color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-200" },
  high:     { label: "High Risk",     color: "text-red-700",   bg: "bg-red-50",    border: "border-red-200"   },
};

function SectionCard({ title, icon: Icon, color, bg, children }) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 border ${bg} shadow-sm`}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2 rounded-xl ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, icon: Icon, mono = false }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}{label}
      </p>
      <p className={`text-sm font-semibold text-gray-800 ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}

function PointsList({ points, color = "text-blue-600" }) {
  if (!points || points.length === 0) {
    return <p className="text-sm text-gray-400 italic">No points recorded.</p>;
  }
  return (
    <ol className="space-y-2.5">
      {points.map((pt, idx) => (
        <li key={idx} className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
            {idx + 1}
          </span>
          <p className="text-sm text-gray-700 leading-relaxed">{pt}</p>
        </li>
      ))}
    </ol>
  );
}

// ── Page Component ────────────────────────────────────────────────────────────
const ViewFeedbackPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const feedbackId = id || searchParams.get("feedback_id");

  const navigate = useNavigate();
  const { currentFeedback: fb, isLoading, getFeedbackById } = useFeedbackStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (feedbackId) getFeedbackById(feedbackId);
  }, [feedbackId]);

  const goBack = () => navigate(-1);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Loading report…</p>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!isLoading && !fb) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Report Not Found</h2>
          <p className="text-gray-500 text-sm mb-5">This feedback report doesn't exist or you don't have permission to view it.</p>
          <button onClick={goBack} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_META[fb?.status] || STATUS_META.stable;
  const StatusIcon = statusMeta.icon;
  const riskMeta   = RISK_META[fb?.risk_level] || RISK_META.low;
  const moodN      = fb?.mood_rating;

  // Merge legacy + new point formats for display
  const feedbackPoints = fb?.feedback_points?.length > 0
    ? fb.feedback_points
    : fb?.problems ? [fb.problems] : [];

  const recSteps = fb?.recommendation_steps?.length > 0
    ? fb.recommendation_steps
    : fb?.recommendations ? [fb.recommendations] : [];

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
        <button onClick={goBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-200 flex-shrink-0">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Session Report</h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Submitted by Dr. {fb?.counsellor_name} · {fb?.createdAt ? new Date(fb.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                </p>
              </div>
            </div>

            {/* Status badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
              <StatusIcon className="w-4 h-4" />{statusMeta.label}
            </div>
          </div>
        </div>

        <div className="space-y-5">

          {/* ── Session & Student Info ───────────────────────────────────── */}
          <SectionCard title="Session Details" icon={Calendar} color="text-blue-600" bg="border-blue-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <InfoRow label="Student" value={fb?.student_name} icon={User} />
              {/* Show anonymous_id only to counsellors and admins */}
              {(user?.role === "counsellor" || user?.role === "admin") && (
                <InfoRow label="Anonymous ID" value={fb?.anonymous_id} icon={User} mono />
              )}
              <InfoRow label="Counsellor" value={`Dr. ${fb?.counsellor_name}`} icon={Heart} />
              <InfoRow label="Session Date"
                value={fb?.date ? new Date(fb.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}
                icon={Calendar} />
              <InfoRow label="Time Slot" value={fb?.slot} icon={Clock} />
              <InfoRow label="Session Type" value={SESSION_TYPE_LABELS[fb?.session_type] || fb?.session_type} icon={Activity} />
              <InfoRow label="Duration" value="30 minutes" icon={Clock} />
            </div>
          </SectionCard>

          {/* ── Clinical Assessment ──────────────────────────────────────── */}
          <SectionCard title="Clinical Assessment" icon={Brain} color="text-purple-600" bg="border-purple-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Status */}
              <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${statusMeta.bg} ${statusMeta.border}`}>
                <StatusIcon className={`w-5 h-5 ${statusMeta.color} flex-shrink-0`} />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Student Status</p>
                  <p className={`text-sm font-bold ${statusMeta.color}`}>{statusMeta.label}</p>
                </div>
              </div>

              {/* Mood */}
              {moodN && (
                <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-100 ${MOOD_BG[moodN]}`}>
                  <span className="text-3xl leading-none">{MOOD_EMOJI[moodN]}</span>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Mood Rating</p>
                    <p className={`text-sm font-bold ${MOOD_COLOR[moodN]}`}>{moodN}/5 — {MOOD_LABEL[moodN]}</p>
                  </div>
                </div>
              )}

              {/* Risk */}
              {fb?.risk_level && (
                <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${riskMeta.bg} ${riskMeta.border}`}>
                  <Flag className={`w-5 h-5 ${riskMeta.color} flex-shrink-0`} />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Risk Level</p>
                    <p className={`text-sm font-bold ${riskMeta.color}`}>{riskMeta.label}</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── Session Feedback Points ──────────────────────────────────── */}
          <SectionCard title="Session Observations & Insights" icon={MessageSquare} color="text-blue-600" bg="border-blue-100">
            <PointsList points={feedbackPoints} />
          </SectionCard>

          {/* ── Recommendations ──────────────────────────────────────────── */}
          <SectionCard title="Recommendations & Next Steps" icon={TrendingUp} color="text-green-600" bg="border-green-100">
            <PointsList points={recSteps} />
          </SectionCard>

          {/* ── Follow-up ────────────────────────────────────────────────── */}
          {(fb?.follow_up_date || fb?.follow_up_notes) && (
            <SectionCard title="Follow-up" icon={CalendarClock} color="text-amber-600" bg="border-amber-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {fb?.follow_up_date && (
                  <InfoRow label="Follow-up Date"
                    value={new Date(fb.follow_up_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    icon={Calendar} />
                )}
                {fb?.follow_up_notes && (
                  <div className="sm:col-span-2 space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Follow-up Notes</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{fb.follow_up_notes}</p>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* ── Report Meta ──────────────────────────────────────────────── */}
          <div className="text-center text-xs text-gray-400 pb-8">
            Report ID: <span className="font-mono">{fb?._id}</span>
            {fb?.createdAt && (
              <> · Submitted {new Date(fb.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ViewFeedbackPage;
