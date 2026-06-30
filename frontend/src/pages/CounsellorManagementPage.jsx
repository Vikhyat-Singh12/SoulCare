import React, { useState, useRef, useEffect } from "react";
import {
  Trash2,
  Plus,
  UserPlus,
  Users,
  GraduationCap,
  Mail,
  Calendar,
  Sparkles,
  Phone,
} from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";

export default function CounsellorManagement() {
  const { addCounsellor, getAllCounsellors, allCounsellors, deleteCounsellor, isAddingCounsellor } = useAuthStore();

  useEffect(() => {
    getAllCounsellors();
  // Re-fetch when list length changes (after add/delete)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCounsellors.length]);

  const [formData, setFormData] = useState({
    c_id: "",
    name: "",
    specialization: "",
    qualification: "",
    experience: "",
    mobile: "",
    email: "",
    about: "",
    image: null,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [expandedCards, setExpandedCards] = useState({});

  // Refs for inputs to restore caret/focus
  const inputRefs = useRef({});

  const validateField = (name, value) => {
    switch (name) {
      case 'c_id':
        if (!value || !value.trim()) return 'Counsellor ID is required';
        if (!/^C\d{3}$/.test(value.trim())) return 'ID must be in format C001, C002, etc.';
        if (allCounsellors.some((c) => c.c_id === value.trim())) return 'This ID already exists';
        return '';
      case 'name':
        if (!value || !value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (!/^[a-zA-Z\s.]+$/.test(value.trim())) return 'Name can only contain letters, spaces, and periods';
        return '';
      case 'specialization':
        return !value ? 'Please select a specialization' : '';
      case 'qualification':
        if (!value || !value.trim()) return 'Qualification is required';
        if (value.trim().length < 5) return 'Please provide a detailed qualification';
        return '';
      case 'experience':
        if (!value || !value.trim()) return 'Years of experience is required';
        const exp = parseInt(value);
        if (isNaN(exp) || exp < 1) return 'Experience must be at least 1 year';
        if (exp > 50) return 'Experience cannot exceed 50 years';
        return '';
      case 'mobile':
        if (!value || !value.trim()) return 'mobile number is required';
        if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) return 'Please enter a valid 10-digit mobile number';
        if (allCounsellors.some((c) => c.mobile === value.replace(/\D/g, ''))) return 'This mobile number is already registered';
        return '';
      case 'email':
        if (!value || !value.trim()) return 'Email address is required';
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address';
        if (allCounsellors.some((c) => c.email.toLowerCase() === value.trim().toLowerCase())) return 'This email is already registered';
        return '';
      case 'about':
        if (!value || !value.trim()) return 'About section is required';
        const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
        if (wordCount < 5) return 'About section must contain at least 5 words';
        if (wordCount > 200) return 'About section cannot exceed 200 words';
        if (value.trim().length < 10) return 'Please provide more detailed information (minimum 10 characters)';
        return '';
      case 'image':
        if (!value) return 'Profile image is required';
        if (value.size > 5 * 1024 * 1024) return 'Image size cannot exceed 5MB';
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(value.type)) {
          return 'Please upload a valid image file (JPG, PNG, or GIF)';
        }
        return '';
      default:
        return '';
    }
  };

  // Centralized transformation that mirrors what you want to store
  const transformValue = (name, raw) => {
    if (name === "experience") {
      return (raw || "").replace(/\D/g, "");
    } else if (name === "mobile") {
      return (raw || "").replace(/\D/g, "").slice(0, 10);
    } else if (name === "about") {
      // limit words to 200; preserve spaces
      const words = (raw || "").split(/\s+/).filter(w => w.length > 0);
      if (words.length <= 200) return raw;
      // if exceeded, return first 200 words joined by single spaces (approx)
      return words.slice(0, 200).join(" ");
    } else {
      return raw;
    }
  };

  const setCaretAndFocus = (name, pos) => {
    // restore caret and focus
    const el = inputRefs.current[name];
    if (!el) return;
    try {
      el.focus();
      if (typeof el.setSelectionRange === "function") {
        el.setSelectionRange(pos, pos);
      }
    } catch (err) {
      // ignore if selection not possible
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const oldValue = formData[name] || "";

    // capture selectionStart for caret mapping
    const selectionStart = typeof e.target.selectionStart === "number" ? e.target.selectionStart : null;

    // handle file input separately
    if (name === "image") {
      const newFile = files && files[0] ? files[0] : null;
      setFormData(prev => ({ ...prev, image: newFile }));
      if (touched[name] && errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
      return;
    }

    // compute new value using transform (keeps consistent rules)
    const newValue = transformValue(name, value);

    // compute how many characters before caret in raw input transform into in newValue
    let rawBefore = "";
    if (selectionStart !== null) {
      rawBefore = value.slice(0, selectionStart);
    }
    const newRawBefore = transformValue(name, rawBefore);
    const caretPos = newRawBefore.length;

    // update form data
    setFormData(prev => ({ ...prev, [name]: newValue }));

    // If the field was touched and had an error, clear it on typing
    if (touched[name] && errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // restore caret after DOM updates
    // small timeout ensures DOM updated
    setTimeout(() => setCaretAndFocus(name, caretPos), 0);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    let checkValue = formData[name];
    // For file input, we already stored file in formData
    const error = validateField(name, checkValue);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleAdd = async () => {
    // Mark all fields as touched and validate everything
    const allTouched = {};
    const newErrors = {};

    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setTouched(allTouched);
    setErrors(newErrors);

    // Stop if there are errors
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      // Prepare FormData (for backend expecting multipart/form-data)
      const data = new FormData();
      data.append("c_id", formData.c_id.trim());
      data.append("name", formData.name.trim());
      data.append("specialization", formData.specialization.trim());
      data.append("qualification", formData.qualification.trim());
      data.append("experience", formData.experience);
      data.append("mobile", formData.mobile.replace(/\D/g, ""));
      data.append("email", formData.email.trim());
      data.append("about", formData.about.trim());

      if (formData.image) {
        data.append("image", formData.image); 
      }

      // Call Zustand store
      await addCounsellor(data);

      // Reset form on success
      setFormData({
        c_id: "",
        name: "",
        specialization: "",
        qualification: "",
        experience: "",
        mobile: "",
        email: "",
        about: "",
        image: null,
      });

      setErrors({});
      setTouched({});
    } catch (err) {
      console.error("Failed to add counsellor:", err);
    }
  };

  const handleDelete = async (_id) => {
    try {
      await deleteCounsellor(_id);
    } catch (err) {
      console.error("Failed to delete counsellor:", err);
    }
  };


  const getWordCount = (text) => {
    return text ? text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
  };

  const specializations = [
    "Anxiety",
    "Depression",
    "Stress",
    "PTSD",
    "Addiction",
    "Relationships",
  ];

  const getSpecializationColor = (spec) => {
    const colors = {
      Anxiety: "from-blue-400 to-blue-600",
      Depression: "from-indigo-400 to-indigo-600",
      Stress: "from-sky-400 to-sky-600",
      PTSD: "from-cyan-400 to-cyan-600",
      Addiction: "from-blue-500 to-blue-700",
      Relationships: "from-sky-500 to-sky-700",
    };
    return colors[spec] || "from-blue-400 to-blue-600";
  };

  // InputField component (uses inputRefs to keep DOM refs)
  const InputField = ({ name, type = "text", placeholder, value, onChange, onBlur, className = "", children }) => {
    const hasError = touched[name] && errors[name];
    const hasValue = value && value.toString().length > 0;

    return (
      <div className="relative">
        <input
          ref={(el) => (inputRefs.current[name] = el)}
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full px-4 py-3 bg-white/80 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-transparent peer ${
            hasError ? 'border-red-300' : 'border-blue-200'
          } ${className}`}
          placeholder={placeholder}
        />
        <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          hasValue ?
          'text-xs -top-2 bg-white px-2 text-blue-600' :
          'text-gray-500 top-3 peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-2'
        }`}>
          {placeholder}
        </label>
        {children}
        {hasError && <span className="text-red-500 text-xs mt-1 block">{errors[name]}</span>}
      </div>
    );
  };

  const TextAreaField = ({ name, placeholder, value, onChange, onBlur, rows = 4 }) => {
    const hasError = touched[name] && errors[name];
    const hasValue = value && value.length > 0;
    const wordCount = getWordCount(value);

    return (
      <div className="relative">
        <textarea
          ref={(el) => (inputRefs.current[name] = el)}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          rows={rows}
          className={`w-full px-4 py-3 bg-white/80 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none placeholder-transparent peer ${
            hasError ? 'border-red-300' : 'border-blue-200'
          }`}
          placeholder={placeholder}
        />
        <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          hasValue ?
          'text-xs -top-2 bg-white px-2 text-blue-600' :
          'text-gray-500 top-3 peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-2'
        }`}>
          {placeholder}
        </label>
        <div className={`absolute bottom-3 right-3 text-xs ${wordCount > 200 ? 'text-red-500' : wordCount > 180 ? 'text-yellow-600' : 'text-gray-400'}`}>
          {wordCount}/200 words
        </div>
        {hasError && <span className="text-red-500 text-xs mt-1 block">{errors[name]}</span>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern with Blue Patches - Same as HomePage */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Blue Patches - Static */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-blue-400 rounded-full opacity-40 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-sky-100 to-sky-400 rounded-full opacity-30 -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-3/4 w-72 h-72 bg-gradient-to-tr from-indigo-100 to-indigo-400 rounded-full opacity-35 translate-y-1/3"></div>
        <div className="absolute bottom-1/3 left-3/4 w-64 h-64 bg-gradient-to-bl from-cyan-100 to-cyan-400 rounded-full opacity-30"></div>
        <div className="absolute top-5/7 right-1/4 w-56 h-56 bg-gradient-to-tl from-blue-100 to-blue-400 rounded-full opacity-25"></div>
      </div>

      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 pt-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 backdrop-blur-xl rounded-full border border-blue-200 mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-700 font-medium">Professional Mental Health Team</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Counsellor Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your team of professional counsellors and mental health specialists
          </p>
        </div>

        {/* Add Counsellor Form */}
        <div className="relative mb-12">
          <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-white/50 to-blue-50/30 rounded-3xl"></div>
          <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl border border-blue-100 p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                Add New Counsellor
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                name="c_id"
                placeholder="Counsellor ID (e.g. C003)"
                value={formData.c_id}
                onChange={handleChange}
                onBlur={handleBlur}
              />

              <InputField
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
              />

              <div className="relative">
                <select
                  ref={(el) => (inputRefs.current["specialization"] = el)}
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 bg-white/80 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    touched.specialization && errors.specialization ? 'border-red-300' : 'border-blue-200'
                  }`}
                >
                  <option value=""></option>
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
                <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  formData.specialization ?
                  'text-xs -top-2 bg-white px-2 text-blue-600' :
                  'text-gray-500 top-3'
                }`}>
                  Specialization
                </label>
                {touched.specialization && errors.specialization && <span className="text-red-500 text-xs mt-1 block">{errors.specialization}</span>}
              </div>

              <InputField
                name="qualification"
                placeholder="Qualification (e.g. PhD Psychology)"
                value={formData.qualification}
                onChange={handleChange}
                onBlur={handleBlur}
              />

              <InputField
                name="experience"
                placeholder="Years of Experience"
                value={formData.experience}
                onChange={handleChange}
                onBlur={handleBlur}
              />

              <InputField
                name="mobile"
                placeholder="Mobile Number"
                value={formData.mobile}
                onChange={handleChange}
                onBlur={handleBlur}
              />

              <div className="md:col-span-2">
                <InputField
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>

              {/* About and Image Section Side by Side */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* About Section */}
                  <TextAreaField
                    name="about"
                    placeholder="About (minimum 5 words, maximum 200 words)"
                    value={formData.about}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={4}
                  />

                  {/* Interactive Image Upload Section */}
                  <div className="relative">
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center bg-white/80 backdrop-blur-sm transition-all ${
                      touched.image && errors.image ? 'border-red-300 hover:border-red-400' : 'border-blue-200 hover:border-blue-400'
                    }`}>
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                        id="image-upload"
                        ref={(el) => (inputRefs.current["image"] = el)}
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        {formData.image ? (
                          <div className="space-y-3">
                            <img
                              src={URL.createObjectURL(formData.image)}
                              alt="Preview"
                              className="w-24 h-24 rounded-full object-cover border-2 border-blue-200 mx-auto"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Image Selected</p>
                              <p className="text-xs text-gray-500">Click to change</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto">
                              <UserPlus className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Upload Profile Image</p>
                              <p className="text-xs text-gray-500">JPG, PNG, GIF (max 5MB)</p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                    <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      formData.image ?
                      'text-xs -top-2 bg-white px-2 text-blue-600' :
                      'text-gray-500 -top-2 text-xs bg-white px-2'
                    }`}>
                      Profile Image
                    </label>
                    {touched.image && errors.image && <span className="text-red-500 text-xs mt-1 block">{errors.image}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start">
              <button
                onClick={handleAdd}
                disabled={isAddingCounsellor} 
                className={`mt-8 group px-8 py-4 rounded-full text-lg font-semibold flex items-center transition-all transform ${
                  isAddingCounsellor
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-2xl hover:shadow-blue-200 hover:scale-105"
                }`}
              >
                <Plus
                  className={`w-5 h-5 mr-2 transition-transform ${
                    !isAddingCounsellor && "group-hover:rotate-90"
                  }`}
                />
                {isAddingCounsellor ? "Adding..." : "Add Counsellor"}
              </button>
            </div>
          </div>
        </div>

        {/* Counsellors Grid */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
            Our Professional Team
          </h2>

          {/* Main Card Container */}
          <div className="relative">
            <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-white/50 to-blue-50/30 rounded-3xl"></div>
            <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl border border-blue-100 p-6 md:p-8 shadow-2xl">

              {allCounsellors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allCounsellors.map((c) => {
                    const isExpanded = expandedCards[c.c_id];
                    const wordCount = getWordCount(c.about);
                    const shouldShowToggle = wordCount > 30; // Show toggle for more than 30 words
                    const displayText = isExpanded || !shouldShowToggle ? c.about :
                      c.about.split(' ').slice(0, 30).join(' ') + '...';

                    return (
                      <div key={c.c_id} className="relative group">
                        <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-blue-50/50 to-white/30 rounded-2xl transform scale-95 group-hover:scale-100 transition-transform"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-200 p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 min-h-[480px] flex flex-col">

                          {/* Header with Image and Delete Button */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-1">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={c.profileUrl}
                                  alt={c.name}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                                />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-lg font-bold text-gray-800 truncate">{c.name}</h3>
                                <p className="text-sm text-gray-500 font-medium">{c.c_id}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDelete(c._id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* About Section with Expand/Collapse */}
                          <div className="mb-4 flex-grow">
                            <div className="max-h-32 overflow-hidden">
                              <p className="text-sm text-gray-600 italic leading-relaxed">
                                {displayText}
                              </p>
                            </div>
                          </div>

                          {/* Specialization Badge */}
                          <div className="mb-4">
                            <span
                              className={`inline-block px-3 py-1 text-white rounded-full text-xs font-medium bg-gradient-to-r ${getSpecializationColor(
                                c.specialization
                              )}`}
                            >
                              {c.specialization}
                            </span>
                          </div>

                          {/* Info Grid */}
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <GraduationCap className="w-3 h-3 text-blue-600" />
                              </div>
                              <span className="font-medium truncate">{c.qualification}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-6 h-6 bg-sky-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-3 h-3 text-sky-600" />
                              </div>
                              <span className="font-medium">{c.experience} years experience</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <Phone className="w-3 h-3 text-indigo-600" />
                              </div>
                              <span className="font-medium">{c.mobile}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-6 h-6 bg-cyan-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <Mail className="w-3 h-3 text-cyan-600" />
                              </div>
                              <span className="font-medium truncate">{c.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : ( /* Empty State Inside Main Card */ <div className="text-center py-16"> <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" /> <h3 className="text-xl font-semibold text-gray-700 mb-2">No Counsellors Yet</h3> <p className="text-gray-500">Add your first counsellor to get started</p> </div> )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
