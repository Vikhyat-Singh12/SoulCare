import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useSessionStore } from '../stores/useSessionStore';

import { 
  Users, 
  UserCheck, 
  Calendar, 
  TrendingUp, 
  Activity, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Plus,
  ChevronRight,
  Sparkles,
  Brain,
  Heart,
  ChevronDown,
  ChevronUp,
  ListChecks,
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [expandedCounsellors, setExpandedCounsellors] = useState({});

  const { groupedSessions, isLoading: sessionsLoading, getAllSessions } = useSessionStore();

  // Fetch all sessions for admin on mount
  useEffect(() => {
    getAllSessions();
  }, []);

  const toggleCounsellor = (c_id) => {
    setExpandedCounsellors(prev => ({ ...prev, [c_id]: !prev[c_id] }));
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const stats = [
    { 
      label: "Total Students", 
      value: 240, 
      change: "+12%", 
      icon: <Users className="w-8 h-8" />, 
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100"
    },
    { 
      label: "Active Counsellors", 
      value: 4, 
      change: "+1", 
      icon: <UserCheck className="w-8 h-8" />, 
      color: "from-sky-500 to-sky-600",
      bgColor: "from-sky-50 to-sky-100"
    },
    { 
      label: "Today's Sessions", 
      value: 56, 
      change: "+8%", 
      icon: <Calendar className="w-8 h-8" />, 
      color: "from-indigo-500 to-indigo-600",
      bgColor: "from-indigo-50 to-indigo-100"
    },
    { 
      label: "AI Interactions", 
      value: 120, 
      change: "+15%", 
      icon: <Brain className="w-8 h-8" />, 
      color: "from-cyan-500 to-cyan-600",
      bgColor: "from-cyan-50 to-cyan-100"
    },
  ];

  const recentAppointments = [
    { student: "Anonymous-101", counsellor: "Dr. Sarah Smith", time: "Today 4:00 PM", status: "confirmed", type: "Video Call" },
    { student: "Anonymous-202", counsellor: "Dr. Emily Johnson", time: "Tomorrow 11:00 AM", status: "pending", type: "Chat Session" },
    { student: "Anonymous-303", counsellor: "Dr. Mike Chen", time: "Today 6:30 PM", status: "completed", type: "Phone Call" },
    { student: "Anonymous-404", counsellor: "Dr. Lisa Brown", time: "Tomorrow 2:00 PM", status: "confirmed", type: "Video Call" },
  ];

  const engagementData = [
    { period: "This Week", activeStudents: 120, sessions: 45, satisfaction: 4.8, trend: "up" },
    { period: "Last Week", activeStudents: 90, sessions: 30, satisfaction: 4.6, trend: "up" },
    { period: "Two Weeks Ago", activeStudents: 85, sessions: 28, satisfaction: 4.5, trend: "stable" },
  ];
  
  // ✅ Updated Quick Actions with navigate routes
  const quickActions = [
    { 
      title: "Manage New Counsellor", 
      description: "Onboard mental health professionals",
      icon: <Plus className="w-5 h-5" />, 
      color: "from-blue-500 to-blue-600",
      action: () => navigate("/manage-counsellors")
    },
    { 
      title: "Student Report", 
      description: "Search and See Student Report",
      icon: <Download className="w-5 h-5" />, 
      color: "from-sky-500 to-sky-600",
      action: () => navigate("/reports")
    },
    { 
      title: "Crisis Alerts", 
      description: "Monitor urgent interventions",
      icon: <AlertCircle className="w-5 h-5" />, 
      color: "from-red-500 to-red-600",
      action: () => navigate("/crisis-alerts")
    },
  ];

  const getStatusIcon = (status) => {
    switch(status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <Activity className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern with Blue Patches */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-blue-400 rounded-full opacity-40 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-sky-100 to-sky-400 rounded-full opacity-30 -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-3/4 w-72 h-72 bg-gradient-to-tr from-indigo-100 to-indigo-400 rounded-full opacity-35 translate-y-1/3"></div>
        <div className="absolute bottom-1/3 left-3/4 w-64 h-64 bg-gradient-to-bl from-cyan-100 to-cyan-400 rounded-full opacity-30"></div>
        <div className="absolute top-5/7 right-1/4 w-56 h-56 bg-gradient-to-tl from-blue-100 to-blue-400 rounded-full opacity-25"></div>
      </div>

      {/* Header + Tab Bar */}
      <div className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center mb-8 mt-5">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Mental Health
                <span className="bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent"> Dashboard</span>
              </h1>
              <p className="text-xl text-gray-600">
                Monitor, manage, and optimize your platform's mental health services
              </p>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-3 justify-center mb-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all border ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-transparent shadow-lg'
                  : 'bg-white/70 text-gray-600 border-blue-200 hover:border-blue-400'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all border ${
                activeTab === 'sessions'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-transparent shadow-lg'
                  : 'bg-white/70 text-gray-600 border-blue-200 hover:border-blue-400'
              }`}
            >
              <ListChecks className="w-4 h-4 inline mr-1" />
              Manage Sessions
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Section */}
          <div className="relative z-10 px-6 pb-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-white/50 to-blue-50/30 rounded-2xl"></div>
                    <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100 p-6 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`inline-flex p-3 bg-gradient-to-br ${stat.color} rounded-xl text-white`}>
                          {stat.icon}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                            {stat.value}
                          </div>
                          <div className="text-xs text-green-600 font-medium flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {stat.change}
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-600 font-medium">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="relative z-10 px-6 pb-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Recent Appointments */}
              <div className="lg:col-span-2 relative">
                <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-white/50 to-blue-50/30 rounded-2xl"></div>
                <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100 p-6 shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                      Recent Appointments
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {recentAppointments.map((appointment, index) => (
                      <div key={index} className="relative">
                        <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-r from-blue-50/30 to-white/50 rounded-xl"></div>
                        <div className="relative bg-white/50 backdrop-blur-sm rounded-xl border border-blue-100 p-4 hover:shadow-md transition-all">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                {getStatusIcon(appointment.status)}
                                <span className="ml-2 font-medium text-gray-800">{appointment.student}</span>
                                <span className="mx-2 text-gray-400">→</span>
                                <span className="text-blue-600 font-medium">{appointment.counsellor}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="w-4 h-4 mr-2" />
                                {appointment.time}
                                <span className="mx-2">•</span>
                                {appointment.type}
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {appointment.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="relative">
                <div className="absolute  backdrop-blur-2xl bg-gradient-to-br from-white/50 to-blue-50/30 rounded-2xl"></div>
                <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100 p-6 shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                    Quick Actions
                  </h2>
                  <div className="space-y-4">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className="w-full group relative"
                      >
                        <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-r from-blue-50/30 to-white/50 rounded-xl group-hover:scale-105 transition-transform"></div>
                        <div className="relative bg-white/50 backdrop-blur-sm rounded-xl border border-blue-100 p-4 text-left hover:shadow-md transition-all">
                          <div className="flex items-center">
                            <div className={`inline-flex p-2 bg-gradient-to-br ${action.color} rounded-lg text-white mr-3`}>
                              {action.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 mb-1">{action.title}</div>
                              <div className="text-xs text-gray-600">{action.description}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Analytics */}
          <div className="relative z-10 px-6 pb-8">
            <div className="max-w-7xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-white/50 to-blue-50/30 rounded-2xl"></div>
                <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100 p-6 shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Student Engagement Analytics
                  </h2>
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {engagementData.map((data, index) => (
                        <div key={index} className="relative">
                          <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-blue-50/30 to-white/50 rounded-xl"></div>
                          <div className="relative bg-white/50 backdrop-blur-sm rounded-xl border border-blue-100 p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-medium text-gray-800">{data.period}</h3>
                              {getTrendIcon(data.trend)}
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Active Students</span>
                                <span className="font-semibold text-blue-600">{data.activeStudents}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Sessions</span>
                                <span className="font-semibold text-sky-600">{data.sessions}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Satisfaction</span>
                                <div className="flex items-center">
                                  <Heart className="w-4 h-4 text-red-500 mr-1" />
                                  <span className="font-semibold text-indigo-600">{data.satisfaction}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Manage Sessions Tab ─────────────────────────────────────────── */}
      {activeTab === 'sessions' && (
        <div className="relative z-10 px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-white/50 to-blue-50/30 rounded-2xl"></div>
              <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100 p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                  <ListChecks className="w-5 h-5 mr-2 text-blue-600" />
                  Manage Sessions — Grouped by Counsellor
                </h2>

                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                    <span className="ml-3 text-gray-500">Loading sessions...</span>
                  </div>
                ) : groupedSessions.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No sessions found.</p>
                    <p className="text-sm mt-1">Sessions will appear here after students book appointments.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupedSessions.map((group) => (
                      <div key={group.c_id} className="relative">
                        <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-r from-blue-50/30 to-white/50 rounded-xl"></div>
                        <div className="relative bg-white/50 backdrop-blur-sm rounded-xl border border-blue-100 overflow-hidden">
                          {/* Counsellor header — click to expand/collapse */}
                          <button
                            onClick={() => toggleCounsellor(group.c_id)}
                            className="w-full flex items-center justify-between p-5 hover:bg-blue-50/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                {group.c_name?.charAt(0) || 'C'}
                              </div>
                              <div className="text-left">
                                <h3 className="font-bold text-gray-900">{group.c_name}</h3>
                                <p className="text-sm text-gray-500">{group.c_id} • {group.sessions.length} session{group.sessions.length !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            {expandedCounsellors[group.c_id]
                              ? <ChevronUp className="w-5 h-5 text-blue-500" />
                              : <ChevronDown className="w-5 h-5 text-gray-400" />
                            }
                          </button>

                          {/* Session table — shown when expanded */}
                          {expandedCounsellors[group.c_id] && (
                            <div className="overflow-x-auto border-t border-blue-100">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-blue-50/60">
                                    <th className="text-left px-4 py-3 text-blue-700 font-semibold">Student Name</th>
                                    <th className="text-left px-4 py-3 text-blue-700 font-semibold">Anonymous ID</th>
                                    <th className="text-left px-4 py-3 text-blue-700 font-semibold">Roll No.</th>
                                    <th className="text-left px-4 py-3 text-blue-700 font-semibold">Branch</th>
                                    <th className="text-left px-4 py-3 text-blue-700 font-semibold">Year</th>
                                    <th className="text-left px-4 py-3 text-blue-700 font-semibold">Date</th>
                                    <th className="text-left px-4 py-3 text-blue-700 font-semibold">Time</th>
                                    <th className="text-left px-4 py-3 text-blue-700 font-semibold">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.sessions.map((session) => (
                                    <tr key={session._id} className="border-t border-blue-50 hover:bg-white/60 transition-colors">
                                      <td className="px-4 py-3 font-medium text-gray-800">{session.student_name}</td>
                                      <td className="px-4 py-3 font-mono text-xs text-indigo-700">{session.anonymous_id}</td>
                                      <td className="px-4 py-3 text-gray-700">{session.rollNo}</td>
                                      <td className="px-4 py-3 text-gray-700">{session.stream}</td>
                                      <td className="px-4 py-3 text-gray-700">{session.academicYear}</td>
                                      <td className="px-4 py-3 text-gray-700">
                                        {new Date(session.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </td>
                                      <td className="px-4 py-3 text-gray-700">{session.slot}</td>
                                      <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                          session.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                                          session.status === 'completed' ? 'bg-green-100 text-green-700' :
                                          session.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                                          'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          {session.status?.charAt(0).toUpperCase() + session.status?.slice(1)}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
