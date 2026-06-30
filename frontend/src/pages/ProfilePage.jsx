import React, { useState, useRef, useEffect } from "react";
import {
  FiUser, FiAward, FiPhone, FiGlobe, FiBell, FiLock, FiCheckCircle,
  FiHome, FiHash, FiCalendar, FiEdit, FiCheck, FiCamera, FiTrash2
} from 'react-icons/fi';
import { useAuthStore } from "../stores/useAuthStore";

// ─── Sub-components (UI unchanged) ───────────────────────────────────────────

const FormField = ({ icon, name, ...props }) => (
  <div className="relative group">
    <div className="absolute top-1/2 -translate-y-1/2 left-4 z-10 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-300">
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <input
      name={name}
      onChange={props.onChange}
      value={props.value}
      className="w-full pl-12 pr-4 py-4 bg-white/40 backdrop-blur-sm border-2 border-transparent rounded-2xl placeholder-slate-500 text-slate-800 font-medium focus:outline-none focus:border-blue-400/80 focus:bg-white/60 transition-all duration-300"
      {...props}
    />
  </div>
);

const ProfileInfoCard = ({ icon, label, value, gradient }) => (
  <div className={`group relative backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl p-6 hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-blue-500/10 transform hover:-translate-y-1 overflow-hidden`}>
    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient} opacity-80 group-hover:opacity-100 transition-opacity duration-300`}></div>
    <div className="flex items-center gap-4">
      <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg text-white`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        <p className="text-lg font-bold text-slate-800 tracking-tight">{value || '—'}</p>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Profile = () => {
  const { user, editProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    rollNo: "",
    stream: "",
    academicYear: "",
    mobile: "",
    imageFile: null,
    imageDataUrl: null,
  });

  // Pre-populate form from the authenticated user's data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        rollNo: user.rollNo || "",
        stream: user.stream || "",
        academicYear: user.academicYear || "",
        mobile: user.mobile || "",
        imageFile: null,
        imageDataUrl: null,
      });
    }
  }, [user]);

  // Show edit form if profile is incomplete
  useEffect(() => {
    if (user && !user.rollNo) {
      setIsEditing(true);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData((prev) => ({ ...prev, imageFile: file, imageDataUrl: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, imageFile: null, imageDataUrl: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerImageUpload = () => fileInputRef.current?.click();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Build multipart/form-data payload
    const data = new FormData();
    data.append("name", formData.name);
    data.append("rollNo", formData.rollNo);
    data.append("stream", formData.stream);
    data.append("academicYear", formData.academicYear);
    data.append("mobile", formData.mobile);
    if (formData.imageFile) {
      data.append("image", formData.imageFile);
    }

    const updatedUser = await editProfile(data);
    setIsSaving(false);
    if (updatedUser) {
      setIsEditing(false);
    }
  };

  const handleEdit = () => {
    // Re-populate form from latest user data before editing
    if (user) {
      setFormData({
        name: user.name || "",
        rollNo: user.rollNo || "",
        stream: user.stream || "",
        academicYear: user.academicYear || "",
        mobile: user.mobile || "",
        imageFile: null,
        imageDataUrl: null,
      });
    }
    setIsEditing(true);
  };

  // Derive the display image — prefer newly selected preview, then saved profile URL
  const displayImage = formData.imageDataUrl || user?.profileUrl || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{ backgroundImage: "linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)", backgroundSize: "50px 50px" }}></div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-blue-400 rounded-full opacity-40 -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-sky-100 to-sky-400 rounded-full opacity-30 -translate-x-1/2 animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-3/4 w-72 h-72 bg-gradient-to-tr from-indigo-100 to-indigo-400 rounded-full opacity-35 translate-y-1/3 animate-pulse delay-2000"></div>
        <div className="absolute bottom-1/3 left-3/4 w-64 h-64 bg-gradient-to-bl from-cyan-100 to-cyan-400 rounded-full opacity-30 animate-pulse delay-3000"></div>
      </div>

      {/* Center Wrapper */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl">
          {!isEditing ? (
            // ── PROFILE DISPLAY VIEW ──────────────────────────────────────────
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-in-out]">
              <div className="backdrop-blur-2xl bg-white/30 border border-white/40 rounded-3xl p-8 shadow-2xl shadow-blue-500/5">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-10">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      {displayImage ? (
                        <img src={displayImage} alt="Profile" className="w-28 h-28 object-cover rounded-full shadow-2xl border-4 border-white/80" />
                      ) : (
                        <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white/80">
                          <span className="text-5xl font-bold text-white tracking-wider">{user?.name?.charAt(0)}</span>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-4 border-white/60 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div>
                      <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        {user?.name}
                      </h1>
                      <p className="text-lg font-medium text-slate-600">{user?.stream} {user?.academicYear ? `• ${user.academicYear} Year` : ''}</p>
                      <div className="mt-2 inline-flex items-center bg-blue-100/50 border border-blue-200/80 rounded-full px-3 py-1 text-sm font-semibold text-blue-700">
                        <FiHash className="w-4 h-4 mr-2" />
                        {user?.anonymous_id}
                      </div>
                    </div>
                  </div>
                  <button onClick={handleEdit} className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-white/20">
                    <span className="relative flex items-center gap-2">
                      <FiEdit className="transition-transform duration-300 group-hover:rotate-[-15deg]" /> Edit Profile
                    </span>
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ProfileInfoCard icon={<FiHash />} label="Roll Number" value={user?.rollNo} gradient="from-blue-400 to-cyan-400" />
                  <ProfileInfoCard icon={<FiPhone />} label="Mobile" value={user?.mobile} gradient="from-cyan-400 to-teal-400" />
                  <ProfileInfoCard icon={<FiAward />} label="Stream" value={user?.stream} gradient="from-teal-400 to-emerald-400" />
                  <ProfileInfoCard icon={<FiCalendar />} label="Academic Year" value={user?.academicYear ? `${user.academicYear} Year` : ''} gradient="from-purple-400 to-violet-400" />
                  <ProfileInfoCard icon={<FiLock />} label="Anonymous ID" value={user?.anonymous_id} gradient="from-violet-400 to-indigo-400" />
                  <ProfileInfoCard icon={<FiCheckCircle />} label="Status" value="Active" gradient="from-emerald-400 to-green-400" />
                </div>
              </div>
            </div>
          ) : (
            // ── PROFILE EDIT/CREATE FORM ──────────────────────────────────────
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-in-out]">
              <div className="text-center">
                <h1 className="text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  {user?.rollNo ? 'Edit Profile' : 'Create Your Profile'}
                </h1>
                <p className="mt-2 text-lg text-slate-600 max-w-2xl mx-auto">
                  Fill in your details to create a personalized and engaging profile.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="backdrop-blur-2xl bg-white/30 border border-white/40 rounded-3xl p-8 shadow-2xl shadow-blue-500/5 space-y-6">
                  <h2 className="text-2xl font-bold text-slate-800">Personal Information</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <FormField icon={<FiUser />} name="name" type="text" placeholder="Your Full Name" value={formData.name} onChange={handleChange} required />
                    <FormField icon={<FiHash />} name="rollNo" type="text" placeholder="Roll Number" value={formData.rollNo} onChange={handleChange} required />
                    <FormField icon={<FiAward />} name="stream" type="text" placeholder="e.g., Computer Science" value={formData.stream} onChange={handleChange} required />
                    <FormField icon={<FiPhone />} name="mobile" type="tel" placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} required />
                    <div className="relative group">
                      <div className="absolute top-1/2 -translate-y-1/2 left-4 z-10 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-300">
                        <FiCalendar size={20} />
                      </div>
                      <select name="academicYear" value={formData.academicYear} onChange={handleChange} required className="w-full pl-12 pr-4 py-4 bg-white/40 backdrop-blur-sm border-2 border-transparent rounded-2xl text-slate-800 font-medium focus:outline-none focus:border-blue-400/80 focus:bg-white/60 transition-all duration-300 appearance-none">
                        <option value="" disabled>Select Academic Year</option>
                        <option value="1st">1st Year</option>
                        <option value="2nd">2nd Year</option>
                        <option value="3rd">3rd Year</option>
                        <option value="4th">4th Year</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="backdrop-blur-2xl bg-white/30 border border-white/40 rounded-3xl p-8 shadow-2xl shadow-blue-500/5">
                  <h2 className="text-2xl font-bold text-slate-800 mb-4">Profile Photo</h2>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative w-32 h-32 rounded-full bg-white/40 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
                      {displayImage ? (
                        <img src={displayImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <FiCamera className="w-10 h-10 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-slate-600 mb-3">Upload a photo to make your profile stand out. (PNG, JPG up to 2MB)</p>
                      <div className="flex items-center justify-center sm:justify-start gap-3">
                        <button type="button" onClick={triggerImageUpload} className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold shadow-md hover:scale-105 transition-transform duration-200">
                          Choose Photo
                        </button>
                        {formData.imageDataUrl && (
                          <button type="button" onClick={removeImage} className="p-2 bg-white/80 border border-slate-300 rounded-lg shadow-sm hover:bg-red-50 transition-colors duration-200">
                            <FiTrash2 className="text-red-500" />
                          </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </div>
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={isSaving} className="group relative w-full py-5 px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-500/30 hover:shadow-3xl hover:shadow-indigo-500/40 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed">
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isSaving ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiCheck className="group-hover:rotate-12 transition-transform duration-300" size={24} /> Save & View Profile
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
