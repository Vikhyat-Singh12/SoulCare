import { useState} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";
import {useNavigate} from "react-router-dom";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const { signup, login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const user = await login({
          email: formData.email,
          password: formData.password,
        });
        
        if (user) {
          // Check if profile is incomplete
          if (user.role === 'student' && !user.rollNo) {
            navigate('/student-profile', { replace: true });
          } else if (user.role === 'counsellor' && !user.specialization) {
            navigate('/counsellor-profile', { replace: true });
          } else {
            navigate(`/${user.role}-dashboard`, { replace: true });
          }
        }
      } else {
        const user = await signup(formData);
        
        if (user) {
          // New signups (which are students by default) have incomplete profiles
          navigate('/student-profile', { replace: true });
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        {/* Blue Patches */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-blue-400 rounded-full opacity-40 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-sky-100 to-sky-400 rounded-full opacity-30 -translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-3/4 w-72 h-72 bg-gradient-to-tr from-indigo-100 to-indigo-400 rounded-full opacity-35 translate-y-1/3 pointer-events-none"></div>
        <div className="absolute bottom-1/3 left-3/4 w-64 h-64 bg-gradient-to-bl from-cyan-100 to-cyan-400 rounded-full opacity-30 pointer-events-none"></div>
        <div className="absolute top-5/7 right-1/4 w-56 h-56 bg-gradient-to-tl from-blue-100 to-blue-400 rounded-full opacity-25 pointer-events-none"></div>
      </div>

      {/* Auth Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Glassmorphic Card */}
        <div className="bg-white/80 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 rounded-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="relative z-10 text-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isLogin ? "Sign in to your account" : "Create your new account"}
            </p>
          </div>

          {/* Toggle */}
          <div className="relative bg-gray-100/60 backdrop-blur-sm rounded-2xl p-1 mb-8">
            <motion.div
              className="absolute top-1 bottom-1 bg-white rounded-xl shadow-sm"
              initial={false}
              animate={{
                left: isLogin ? "0.25rem" : "50%",
                right: isLogin ? "50%" : "0.25rem",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <div className="relative flex">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-colors relative z-10 cursor-pointer ${
                  isLogin ? "text-gray-800" : "text-gray-500"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-colors relative z-10 cursor-pointer ${
                  !isLogin ? "text-gray-800" : "text-gray-500"
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "signup"}
              onSubmit={handleSubmit}
              className="space-y-5 relative z-10"
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Name (only signup) */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                    placeholder="Enter your full name"
                  />
                </motion.div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    required
                    className="w-full px-4 py-3.5 pr-12 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6 relative z-10">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
