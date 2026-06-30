import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Clock, Video, Phone, MessageCircle, Users, CheckCircle,
  Play, User, BarChart3, Heart, Search,
  FileText, Eye, PieChart, Menu, X, Send, ChevronDown, ChevronUp,
  Filter, Activity, LogOut, Home, ClipboardList,
  ChevronRight, RefreshCw, Inbox, Loader
} from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";
import { useSessionStore } from "../stores/useSessionStore";
import { useFeedbackStore } from "../stores/useFeedbackStore";
import socket from "../socket/socket";
import axios from "../lib/axios";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SESSION_TYPE_META = {
  video: { label: "Video Call", icon: Video,         color: "text-blue-600",   bg: "bg-blue-50",   bar: "bg-blue-500"   },
  voice: { label: "Voice Call", icon: Phone,         color: "text-indigo-600", bg: "bg-indigo-50", bar: "bg-indigo-500" },
  chat:  { label: "Text Chat",  icon: MessageCircle, color: "text-green-600",  bg: "bg-green-50",  bar: "bg-green-500"  },
};

function parseSlot(rawDate, slot) {
  try {
    const dateStr = new Date(rawDate).toISOString().split("T")[0];
    const match = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return { slotStart: new Date(0), slotEnd: new Date(0) };
    let h = parseInt(match[1]), m = parseInt(match[2]);
    const p = match[3].toUpperCase();
    if (p === "PM" && h !== 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
    const slotStart = new Date(
      `${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
    );
    const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);
    return { slotStart, slotEnd };
  } catch {
    return { slotStart: new Date(0), slotEnd: new Date(0) };
  }
}

// Returns: 'upcoming' | 'ready' | 'in-progress' | 'expired'
function getDisplayStatus(session, now) {
  if (!session.date || !session.slot) return "expired";
  const { slotStart, slotEnd } = parseSlot(session.date, session.slot);
  if (now > slotEnd) return "expired";
  if (now >= slotStart && now <= slotEnd) return "in-progress";
  if (now >= new Date(slotStart.getTime() - 10 * 60 * 1000) && now < slotStart) return "ready";
  return "upcoming";
}

function formatDate(date) {
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// FeedbackModal removed — feedback is now handled by the dedicated /feedback-form page

// ─── Session Row ──────────────────────────────────────────────────────────────
function SessionRow({ session, tab, displayStatus, onJoin, onWrite, onView }) {
  const typeMeta = SESSION_TYPE_META[session.session_type] || SESSION_TYPE_META.video;
  const TypeIcon = typeMeta.icon;

  const statusBadge = () => {
    if (tab === "completed")
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />Completed
        </span>
      );
    if (displayStatus === "in-progress")
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />Live
        </span>
      );
    if (displayStatus === "ready")
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" />Ready
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Clock className="w-3 h-3" />Upcoming
      </span>
    );
  };

  return (
    <tr className="hover:bg-blue-50/40 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">{session.student_name || "\u2014"}</div>
            <div className="text-xs text-gray-400 font-mono">{session.anonymous_id}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="text-sm font-medium text-gray-800">{formatDate(session.date)}</div>
        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />{session.slot} &middot; 30 min
        </div>
      </td>
      <td className="px-5 py-4">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeMeta.bg} ${typeMeta.color}`}>
          <TypeIcon className="w-3 h-3" />{typeMeta.label}
        </div>
      </td>
      <td className="px-5 py-4">{statusBadge()}</td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          {(displayStatus === "ready" || displayStatus === "in-progress") && (
            <button
              onClick={() => onJoin(session.session_link)}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-semibold hover:shadow-md transition flex items-center gap-1"
            >
              <Play className="w-3 h-3" />Join
            </button>
          )}
          {displayStatus === "upcoming" && tab === "upcoming" && (
            <button disabled className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-xs font-medium cursor-not-allowed flex items-center gap-1">
              <Clock className="w-3 h-3" />Opens 10 min before
            </button>
          )}
          {tab === "completed" &&
            (session.feedback_report ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />Report given
                </span>
                <button
                  onClick={() => onView(session)}
                  className="px-2.5 py-1.5 text-xs border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />View
                </button>
              </div>
            ) : (
              <button
                onClick={() => onWrite(session._id)}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-xs font-semibold hover:shadow-md transition flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />Write Report
              </button>
            ))}
        </div>
      </td>
    </tr>
  );
}

// ─── Patient Row (expandable) ─────────────────────────────────────────────────
function PatientRow({ patient, onWrite, onView }) {
  const [expanded, setExpanded] = useState(false);
  const latestSession  = patient.sessions[0];
  const completedCount = patient.sessions.filter(
    (s) => s.status === "completed" || s._displayStatus === "expired"
  ).length;
  const upcomingCount = patient.sessions.filter(
    (s) => s.status === "upcoming" && s._displayStatus === "upcoming"
  ).length;

  return (
    <>
      <tr className="hover:bg-purple-50/30 transition-colors">
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-900">{patient.student_name || "—"}</div>
              <div className="text-xs text-gray-400 font-mono">{patient.anonymous_id}</div>
            </div>
          </div>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
              {patient.sessions.length} total
            </span>
            {completedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                {completedCount} done
              </span>
            )}
            {upcomingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                {upcomingCount} upcoming
              </span>
            )}
          </div>
        </td>
        <td className="px-5 py-4">
          {latestSession ? (
            <div>
              <div className="text-sm text-gray-700">{formatDate(latestSession.date)} at {latestSession.slot}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {SESSION_TYPE_META[latestSession.session_type]?.label || "Video Call"}
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>
        <td className="px-5 py-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 text-xs border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition flex items-center gap-1"
          >
            {expanded ? <><ChevronUp className="w-3 h-3" />Hide</> : <><ChevronDown className="w-3 h-3" />All Sessions</>}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={4} className="px-5 pb-4">
            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100 text-xs text-gray-500">
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Slot</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patient.sessions.map((s, i) => {
                    const meta = SESSION_TYPE_META[s.session_type] || SESSION_TYPE_META.video;
                    const Icon = meta.icon;
                    // Use real-time display status for correct label
                    const isCompleted = s.status === "completed" || s._displayStatus === "expired";
                    const isLive = s._displayStatus === "in-progress" || s._displayStatus === "ready";
                    const statusLabel = isCompleted ? "Completed" : isLive ? "Live" : "Upcoming";
                    const statusClass = isCompleted
                      ? "bg-green-100 text-green-700"
                      : isLive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700";
                    return (
                      <tr key={i} className="hover:bg-white transition">
                        <td className="px-4 py-2.5 text-gray-700">{formatDate(s.date)}</td>
                        <td className="px-4 py-2.5 text-gray-500">{s.slot}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 text-xs ${meta.color}`}>
                            <Icon className="w-3 h-3" />{meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {s.feedback_report ? (
                            <button
                              onClick={() => onView(s)}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />View report
                            </button>
                          ) : isCompleted ? (
                            <button
                              onClick={() => onWrite(s._id)}
                              className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />Write report
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const CounsellorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { counsellorSessions, getCounsellorSessions } = useSessionStore();
  const { counsellorFeedback, getCounsellorFeedback } = useFeedbackStore();

  const [activeSection, setActiveSection]     = useState("dashboard");
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [sessionTab, setSessionTab]           = useState("upcoming");
  const [currentTime, setCurrentTime]         = useState(new Date());
  // feedbackSession state removed — feedback is handled by /feedback-form page
  const [patientSearch, setPatientSearch]     = useState("");
  const [patientFilter, setPatientFilter]     = useState("all");

  // Clock tick every 30s
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Fetch sessions on mount
  useEffect(() => {
    if (!user?.c_id) return;
    getCounsellorSessions(user.c_id);
    getCounsellorFeedback(user.c_id);
  }, [user?.c_id, getCounsellorSessions, getCounsellorFeedback]);

  // ── Real-time: student books a session → auto-refresh ──────────────────────
  useEffect(() => {
    if (!user?.c_id) return;
    const refresh = () => {
      getCounsellorSessions(user.c_id);
      getCounsellorFeedback(user.c_id);
    };
    // Connect if not already connected
    if (!socket.connected) socket.connect();
    socket.on("session-booked", refresh);
    return () => socket.off("session-booked", refresh);
  }, [user?.c_id, getCounsellorSessions, getCounsellorFeedback]);

  const feedbackBySessionId = useMemo(() => {
    const map = new Map();
    counsellorFeedback.forEach((feedback) => {
      if (feedback.session_id) map.set(String(feedback.session_id), feedback);
    });
    return map;
  }, [counsellorFeedback]);

  // ── Derived session lists (cancelled EXCLUDED, newest first) ───────────────
  const sessions = useMemo(() => {
    return counsellorSessions
      .filter((s) => s.status !== "cancelled")
      .map((s) => {
        const feedbackReport =
          feedbackBySessionId.get(String(s._id)) ||
          feedbackBySessionId.get(String(s.session_id)) ||
          null;

        return {
          ...s,
          _displayStatus: getDisplayStatus(s, currentTime),
          feedback_report: feedbackReport,
          counsellor_feedback: feedbackReport
            ? feedbackReport.problems || feedbackReport.feedback_points?.join("\n") || "Submitted"
            : null,
          feedback_submitted_at: feedbackReport?.createdAt || null,
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [counsellorSessions, currentTime, feedbackBySessionId]);

  const upcomingSessions  = sessions.filter((s) => s.status === "upcoming" && s._displayStatus === "upcoming");
  const ongoingSessions   = sessions.filter((s) => s.status === "upcoming" && (s._displayStatus === "in-progress" || s._displayStatus === "ready"));
  const completedSessions = sessions.filter((s) => s.status === "completed" || (s.status === "upcoming" && s._displayStatus === "expired"));

  const tabSessionMap     = { upcoming: upcomingSessions, ongoing: ongoingSessions, completed: completedSessions };
  const activeTabSessions = tabSessionMap[sessionTab] || [];

  // ── Analytics ──────────────────────────────────────────────────────────────
  const totalSessions  = sessions.length; // cancelled not counted
  const doneCount      = completedSessions.length;
  const uniquePatients = new Set(sessions.map((s) => s.anonymous_id)).size;
  const isNew          = totalSessions === 0;

  // ── Patients (grouped, cancelled excluded) ─────────────────────────────────
  const patients = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      const key = s.anonymous_id;
      if (!map.has(key)) {
        map.set(key, {
          anonymous_id: s.anonymous_id,
          student_name: s.student_name,
          student_email: s.student_email,
          sessions: [],
        });
      }
      map.get(key).sessions.push(s);
    });
    // sessions already sorted newest-first, so each patient's list inherits that order
    return Array.from(map.values());
  }, [sessions]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const q = patientSearch.toLowerCase();
      const matchesSearch =
        !q ||
        (p.student_name || "").toLowerCase().includes(q) ||
        p.anonymous_id.toLowerCase().includes(q) ||
        (p.student_email || "").toLowerCase().includes(q);
      let matchesFilter = true;
      if (patientFilter !== "all") {
        if (patientFilter === "completed") {
          matchesFilter = p.sessions.some((s) => s.status === "completed" || s._displayStatus === "expired");
        } else if (patientFilter === "upcoming") {
          matchesFilter = p.sessions.some((s) => s.status === "upcoming" && s._displayStatus === "upcoming");
        } else if (["video", "voice", "chat"].includes(patientFilter)) {
          matchesFilter = p.sessions.some((s) => s.session_type === patientFilter);
        }
      }
      return matchesSearch && matchesFilter;
    });
  }, [patients, patientSearch, patientFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleJoin = (sessionLink) => {
    const roomName = sessionLink.split("/").pop();
    navigate(`/session/${roomName}`);
  };

  // Navigate to write feedback (no existing report yet)
  const handleOpenFeedback = (sessionId) => {
    navigate(`/feedback-form?session_id=${sessionId}`);
  };

  // Navigate to view an existing feedback report (look up by session._id)
  const handleViewFeedback = async (session) => {
    const sessionId = session?._id || session;
    if (session?.feedback_report?._id) {
      navigate(`/feedback/${session.feedback_report._id}`);
      return;
    }

    try {
      const { data } = await axios.get(`/feedback/by-session/${sessionId}`);
      if (data?.feedback?._id) {
        navigate(`/feedback/${data.feedback._id}`);
      }
    } catch {
      // If not found yet, fall back to the write form
      navigate(`/feedback-form?session_id=${sessionId}`);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Morning";
    if (h < 17) return "Afternoon";
    return "Evening";
  };

  // ── Nav items ──────────────────────────────────────────────────────────────
  const navItems = [
    { label: "Dashboard", icon: Home,      section: "dashboard" },
    { label: "Sessions",  icon: Calendar,  section: "sessions"  },
    { label: "Patients",  icon: Users,     section: "patients"  },
    { label: "Reports",   icon: BarChart3, section: "reports"   },
  ];

  // ─── Section Renderers ───────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Hero banner with date/time on the right */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -right-8 bottom-0 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Welcome back</p>
            <h2 className="text-2xl font-extrabold mb-1">Good {greeting()}, Dr. {user?.name?.split(" ")[0]} 👋</h2>
            <p className="text-blue-100 text-sm">
              {isNew
                ? "Your dashboard is ready. Students who book with you will appear here."
                : ongoingSessions.length > 0
                ? `You have ${ongoingSessions.length} live session${ongoingSessions.length > 1 ? "s" : ""} right now!`
                : `${upcomingSessions.length} upcoming session${upcomingSessions.length !== 1 ? "s" : ""} scheduled.`}
            </p>
          </div>
          {/* Live clock */}
          <div className="text-right flex-shrink-0">
            <p className="text-white text-2xl font-bold tabular-nums leading-tight">
              {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </p>
            <p className="text-blue-200 text-xs mt-1">
              {currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {isNew ? (
        <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-12 text-center">
          <div className="inline-flex p-4 bg-blue-100 rounded-2xl mb-4">
            <Activity className="w-9 h-9 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Analytics will appear here</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
            Once students book and you conduct sessions, your performance insights will show up here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total Sessions", value: totalSessions,          icon: Calendar,    from: "from-blue-500",   to: "to-blue-600",    sub: "Excl. cancelled"                                               },
            { title: "Upcoming",       value: upcomingSessions.length, icon: Clock,       from: "from-amber-400",  to: "to-orange-500",  sub: "Scheduled"                                                     },
            { title: "Completed",      value: doneCount,               icon: CheckCircle, from: "from-green-500",  to: "to-emerald-600", sub: `${totalSessions > 0 ? Math.round((doneCount / totalSessions) * 100) : 0}% rate` },
            { title: "Patients",       value: uniquePatients,          icon: Users,       from: "from-purple-500", to: "to-purple-600",  sub: "Unique students"                                               },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
              <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${s.from} ${s.to} text-white mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mb-0.5">{s.value}</div>
              <div className="text-sm font-semibold text-gray-700">{s.title}</div>
              {/* <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div> */}
            </div>
          ))}
        </div>
      )}

      {/* Live alert */}
      {ongoingSessions.length > 0 && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <p className="text-sm font-semibold text-emerald-800">
              {ongoingSessions.length === 1 ? "You have a live session right now!" : `${ongoingSessions.length} sessions are active now!`}
            </p>
          </div>
          <button
            onClick={() => { setActiveSection("sessions"); setSessionTab("ongoing"); }}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />Join Now
          </button>
        </div>
      )}

      {/* Recent Sessions */}
      {!isNew && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Recent Sessions</h3>
            <button onClick={() => setActiveSection("sessions")} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {sessions.slice(0, 5).map((s, i) => {
              const meta = SESSION_TYPE_META[s.session_type] || SESSION_TYPE_META.video;
              const Icon = meta.icon;
              const isCompleted = s.status === "completed" || s._displayStatus === "expired";
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition">
                  <div className={`p-2 rounded-xl ${meta.bg} flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.student_name || s.anonymous_id}</p>
                    <p className="text-xs text-gray-500">{formatDate(s.date)} &middot; {s.slot}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                    isCompleted ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {isCompleted ? "Completed" : "Upcoming"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">Sessions</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage all your counselling appointments (newest first)</p>
      </div>

      {/* Tabs — 3 only, no cancelled */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {[
          { key: "upcoming",  label: "Upcoming",  count: upcomingSessions.length  },
          { key: "ongoing",   label: "Live Now",  count: ongoingSessions.length   },
          { key: "completed", label: "Completed", count: completedSessions.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setSessionTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              sessionTab === t.key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              sessionTab === t.key ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {activeTabSessions.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No {sessionTab} sessions</p>
            <p className="text-sm text-gray-400 mt-1">
              {sessionTab === "upcoming"
                ? "Scheduled future sessions appear here."
                : sessionTab === "ongoing"
                ? "Sessions go live 10 min before their start time."
                : "Sessions appear here once their window closes."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <tr>
                  {["Student", "Date & Time", "Type", "Status", "Action"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeTabSessions.map((s) => (
                  <SessionRow
                    key={s._id}
                    session={s}
                    tab={sessionTab}
                    displayStatus={s._displayStatus}
                    onJoin={handleJoin}
                    onWrite={handleOpenFeedback}
                    onView={handleViewFeedback}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">Patients</h2>
        <p className="text-sm text-gray-500 mt-0.5">Students with active or past sessions (cancelled sessions excluded)</p>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Search by name, anonymous ID, or email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {[
            { key: "all",       label: "All"          },
            { key: "upcoming",  label: "Has Upcoming" },
            { key: "completed", label: "Has Completed"},
            { key: "video",     label: "Video"        },
            { key: "voice",     label: "Voice"        },
            { key: "chat",      label: "Chat"         },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setPatientFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                patientFilter === f.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">
              {patients.length === 0 ? "No patients yet" : "No patients match your search"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {patients.length === 0
                ? "Students who book sessions with you will appear here."
                : "Try adjusting the filters or search term."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100">
                <tr>
                  {["Student", "Sessions", "Latest Session", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPatients.map((p, i) => (
                  <PatientRow key={i} patient={p} onWrite={handleOpenFeedback} onView={handleViewFeedback} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">Reports & Analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your counselling performance overview</p>
      </div>

      {isNew ? (
        <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-14 text-center">
          <div className="inline-flex p-4 bg-blue-100 rounded-2xl mb-4">
            <BarChart3 className="w-9 h-9 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No data yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Analytics and reports will appear here automatically once you have conducted your first session.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Session breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />Session Breakdown
            </h3>
            <div className="space-y-4">
              {[
                { label: "Completed", count: doneCount,               color: "bg-green-500", text: "text-green-700" },
                { label: "Upcoming",  count: upcomingSessions.length, color: "bg-blue-500",  text: "text-blue-700"  },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-700 font-medium">{r.label}</span>
                    <span className={`font-bold ${r.text}`}>{r.count} <span className="font-normal text-gray-400">/ {totalSessions}</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${r.color} transition-all`} style={{ width: `${totalSessions > 0 ? (r.count / totalSessions) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session type breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />Session Types
            </h3>
            <div className="space-y-4">
              {["video", "voice", "chat"].map((type) => {
                const meta = SESSION_TYPE_META[type];
                const Icon = meta.icon;
                const count = sessions.filter((s) => s.session_type === type).length;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${meta.bg} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{meta.label}</span>
                        <span className="font-bold text-gray-900">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${totalSessions > 0 ? (count / totalSessions) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-green-600" />Session Reports
            </h3>
            {(() => {
              const withFeedback    = completedSessions.filter((s) => s.counsellor_feedback).length;
              const withoutFeedback = completedSessions.length - withFeedback;
              const pct = completedSessions.length > 0 ? Math.round((withFeedback / completedSessions.length) * 100) : 0;
              return (
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="text-center">
                    <div className="text-4xl font-extrabold text-green-600">{withFeedback}</div>
                    <div className="text-xs text-gray-500 mt-1">Reports submitted</div>
                  </div>
                  <div className="flex-1 min-w-32">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{pct}% complete</span>
                      <span>{completedSessions.length} total</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-extrabold text-gray-400">{withoutFeedback}</div>
                    <div className="text-xs text-gray-500 mt-1">Pending reports</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );

  const sectionRenderers = { dashboard: renderDashboard, sessions: renderSessions, patients: renderPatients, reports: renderReports };

  // ─── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      {/* Background Pattern — same theme as all other pages */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
            backgroundSize: "50px 50px"
          }} />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full opacity-40 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-sky-100 to-sky-200 rounded-full opacity-30 -translate-x-1/2" />
        <div className="absolute bottom-0 right-3/4 w-72 h-72 bg-gradient-to-tr from-indigo-100 to-indigo-200 rounded-full opacity-35 translate-y-1/3" />
        <div className="absolute bottom-1/3 left-3/4 w-64 h-64 bg-gradient-to-bl from-cyan-100 to-cyan-200 rounded-full opacity-30" />
      </div>

      {/* max-w-7xl centred layout */}
      <div className="relative min-h-screen max-w-7xl mx-auto flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className={`
          fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:z-auto lg:w-56 flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className={` ${sidebarOpen?"h-full":""} flex flex-col bg-white/95 backdrop-blur-xl border-r border-blue-100 shadow-xl lg:shadow-sm`}>

            {/* Profile */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(user?.name || "C").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">Dr. {user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => (
                <button
                  key={item.section}
                  onClick={() => { setActiveSection(item.section); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeSection === item.section
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200/50"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                  {item.section === "sessions" && ongoingSessions.length > 0 && (
                    <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              ))}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-gray-100">
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition"
              >
                <LogOut className="w-4 h-4" />Logout
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main ─────────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile-only slim topbar (hamburger + refresh/live badge, NO title/logo) */}
          <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-xl transition">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => getCounsellorSessions(user?.c_id)}
                className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {ongoingSessions.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {ongoingSessions.length} Live
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 lg:p-6">
            {(sectionRenderers[activeSection] || renderDashboard)()}
          </div>
        </main>
      </div>

    </div>
  );
};

export default CounsellorDashboard;
