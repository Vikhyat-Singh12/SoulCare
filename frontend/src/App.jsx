import {
  // BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import StudentDashboard from "./pages/StudentDashboard";
import ChatbotPage from "./pages/ChatBotPage";
import BookingPage from "./pages/Booking";
import About from "./pages/About";
import ContactPage from "./pages/Contact";
import ResourcePage from "./pages/Resource";
import ProfilePage from "./pages/ProfilePage";
import CounsellorDashboard from "./pages/CounsellorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CounsellorManagement from "./pages/CounsellorManagementPage";
import FeedbackPage from "./pages/FeedbackPage";
import ViewFeedbackPage from "./pages/ViewFeedbackPage";
import Reports from "./pages/Reports";
import CounsellorProfile from "./pages/CounsellorProfile";
import CommunitySupportPage from "./pages/CommunitySupportPage";
import LiveSession from "./pages/LiveSession";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useAuthStore } from "./stores/useAuthStore";

// ─── Route Guards ─────────────────────────────────────────────────────────────

/**
 * Redirect away from auth page if already logged in.
 * After login, send user to their role's dashboard.
 */
const PublicOnlyRoute = ({ children }) => {
  const { user, isCheckingAuth } = useAuthStore();
  if (isCheckingAuth) return null; // wait for auth check to complete
  if (!user) return children;

  // If profile is incomplete, redirect to profile page instead of dashboard
  if (user.role === "student" && !user.rollNo) {
    return <Navigate to="/student-profile" replace />;
  } else if (user.role === "counsellor" && !user.specialization) {
    return <Navigate to="/counsellor-profile" replace />;
  }

  // Otherwise redirect to dashboard based on role
  return <Navigate to={`/${user.role}-dashboard`} replace />;
};

/**
 * Protect routes that require authentication.
 * Optionally restrict to a specific role.
 */
const ProtectedRoute = ({ children, allowedRole, isProfileRoute }) => {
  const { user, isCheckingAuth } = useAuthStore();
  if (isCheckingAuth) return null; // wait for auth check
  if (!user) return <Navigate to="/auth" replace />;

  // Force incomplete profiles to stay on the profile page
  if (!isProfileRoute) {
    if (
      user.role === "student" &&
      (!user.rollNo || !user.stream || !user.academicYear || !user.mobile)
    ) {
      return <Navigate to="/student-profile" replace />;
    } else if (user.role === "counsellor" && !user.specialization) {
      return <Navigate to="/counsellor-profile" replace />;
    }
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={`/${user.role}-dashboard`} replace />;
  }

  return children;
};

// ─── App ──────────────────────────────────────────────────────────────────────

const App = () => {
  const location = useLocation();
  const { user, getMe } = useAuthStore();

  const hideLayout = location.pathname.startsWith("/session/");

  // Restore session on app load (reads the JWT cookie)
  useEffect(() => {
    getMe();
  }, []);

  return (
    <>
      {/* <Router> */}
        {!hideLayout && <Navbar />}
        <Routes>
          {/* ── Public ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/resources" element={<ResourcePage />} />
          <Route path="/support" element={<CommunitySupportPage />} />

          {/* ── Auth (redirect if already logged in) ── */}
          <Route
            path="/auth"
            element={
              <PublicOnlyRoute>
                <Auth />
              </PublicOnlyRoute>
            }
          />

          {/* ── Student Routes ── */}
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking"
            element={
              <ProtectedRoute allowedRole="student">
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-profile"
            element={
              <ProtectedRoute allowedRole="student" isProfileRoute={true}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chatbot"
            element={
              <ProtectedRoute allowedRole="student">
                <ChatbotPage />
              </ProtectedRoute>
            }
          />

          {/* ── Counsellor Routes ── */}
          <Route
            path="/counsellor-dashboard"
            element={
              <ProtectedRoute allowedRole="counsellor">
                <CounsellorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/counsellor-profile"
            element={
              <ProtectedRoute allowedRole="counsellor" isProfileRoute={true}>
                <CounsellorProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback-form"
            element={
              <ProtectedRoute allowedRole="counsellor">
                <FeedbackPage />
              </ProtectedRoute>
            }
          />
          {/* View a specific feedback report (counsellor, student who it's about, or admin) */}
          <Route
            path="/feedback/:id"
            element={
              <ProtectedRoute>
                <ViewFeedbackPage />
              </ProtectedRoute>
            }
          />

          {/* ── Admin Routes ── */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-counsellors"
            element={
              <ProtectedRoute allowedRole="admin">
                <CounsellorManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRole="admin">
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* ── Live Video Session Route ── */}
          <Route
            path="/session/:roomName"
            element={
              <ProtectedRoute>
                <LiveSession />
              </ProtectedRoute>
            }
          />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {!hideLayout && <Footer />}
      {/* </Router> */}
      <Toaster position="top-right" />
    </>
  );
};

export default App;
