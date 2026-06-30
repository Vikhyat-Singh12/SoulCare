import React from "react";
import { Mail, Phone, Star, Heart, Badge } from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";

export default function CounsellorProfile() {
  const { user } = useAuthStore();

  // Merge real data from auth store with safe fallbacks
  const counsellor = {
    id: user?.c_id || 'N/A',
    name: user?.name || 'Counsellor',
    experience: user?.experience ? `${user.experience} years` : 'N/A',
    specialization: user?.specialization || 'Mental Health',
    email: user?.email || '',
    phone: user?.mobile || '',
    image: user?.profileUrl || `https://i.pravatar.cc/150?u=${user?._id}`,
    qualification: user?.qualification || '',
    availability: 'Mon - Fri, 10:00 AM - 6:00 PM',
    languages: ['English'],
    bio: user?.about || 'Dedicated mental health professional committed to student wellbeing.',
    rating: 4.9,
    totalSessions: 0,
  };

  return (
    // NOTE: wrapper is now a flex container and centers the content both vertically & horizontally
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center">
      {/* Background Pattern with Blue Patches (copied from HomePage) */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>

        {/* Blue Patches - Static (no blur on these elements) */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-blue-400 rounded-full opacity-40 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-sky-100 to-sky-400 rounded-full opacity-30 -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-3/4 w-72 h-72 bg-gradient-to-tr from-indigo-100 to-indigo-400 rounded-full opacity-35 translate-y-1/3"></div>
        <div className="absolute bottom-1/3 left-3/4 w-64 h-64 bg-gradient-to-bl from-cyan-100 to-cyan-400 rounded-full opacity-30"></div>
        <div className="absolute top-[60%] right-1/4 w-56 h-56 bg-gradient-to-tl from-blue-100 to-blue-400 rounded-full opacity-25"></div>
      </div>

      {/* Content above blobs — centered by parent flex */}
      <section className="relative z-10 px-6 py-12 w-full">
        <div className="max-w-6xl mx-auto">
          {/* Main Profile Card */}
          <div className="relative mb-8">
            {/* subtle glass card background (does not cover page) */}
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-blue-100 p-8 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-start gap-8 mb-8">
                {/* Profile image + badge */}
                <div className="flex flex-col items-center text-center lg:text-left lg:items-start">
                  <div className="relative mb-4">
                    <img
                      src={counsellor.image}
                      alt={counsellor.name}
                      className="w-44 h-44 rounded-full object-cover border-4 ring-2 ring-white shadow-2xl"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full p-2 border-4 border-white shadow-lg">
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="text-2xl font-bold text-gray-800">{counsellor.rating}</span>
                    <span className="text-sm text-gray-500">({counsellor.totalSessions} sessions)</span>
                  </div>

                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-blue-50 to-white rounded-full border border-blue-200 mb-4">
                    <Badge className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700 font-medium">Verified Counsellor</span>
                  </div>
                </div>

                {/* Main Info */}
                <div className="flex-1 w-full">
                  <h1 className="text-4xl font-bold mb-2 text-gray-900">{counsellor.name}</h1>
                  <p className="text-xl text-blue-600 font-semibold mb-2">{counsellor.specialization}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100">
                      <div className="text-2xl font-bold text-blue-600">{counsellor.experience}</div>
                      <div className="text-sm text-gray-600">Experience</div>
                    </div>

                    <div className="text-center p-3 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100">
                      <div className="text-2xl font-bold text-indigo-600">{counsellor.languages.length}</div>
                      <div className="text-sm text-gray-600">Languages</div>
                    </div>

                    <div className="text-center p-3 bg-gradient-to-br from-cyan-50 to-white rounded-xl border border-cyan-100">
                      <div className="text-2xl font-bold text-cyan-600">{counsellor.availability}</div>
                      <div className="text-sm text-gray-600">Availability</div>
                    </div>

                    <div className="text-center p-3 bg-gradient-to-br from-sky-50 to-white rounded-xl border border-sky-100">
                      <div className="text-2xl font-bold text-sky-600">ID: {counsellor.id}</div>
                      <div className="text-sm text-gray-600">Counsellor</div>
                    </div>
                  </div>

                  {/* Contact row + CTAs */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <a
                      href={`mailto:${counsellor.email}`}
                      className="flex-1 p-3 flex items-center gap-3 bg-white/90 border border-blue-100 rounded-xl hover:shadow-md transition focus:outline-none"
                      aria-label="Email counsellor"
                    >
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div className="text-sm text-gray-700">{counsellor.email}</div>
                    </a>

                    <a
                      href={`tel:${counsellor.phone.replace(/\s+/g, "")}`}
                      className="flex-1 p-3 flex items-center gap-3 bg-white/90 border border-sky-100 rounded-xl hover:shadow-md transition focus:outline-none"
                      aria-label="Call counsellor"
                    >
                      <Phone className="w-5 h-5 text-sky-600" />
                      <div className="text-sm text-gray-700">{counsellor.phone}</div>
                    </a>
                  </div>
                </div>
              </div>

              {/* About section */}
              <div className="mt-6 p-6 bg-white/75 rounded-2xl border border-blue-100 shadow-inner">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500" />
                  About {counsellor.name}
                </h2>
                <p className="text-gray-600 leading-relaxed text-lg">{counsellor.bio}</p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                    <div className="text-sm text-gray-500">Qualification</div>
                    <div className="font-medium text-gray-700">{counsellor.qualification}</div>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-50 to-white border border-cyan-100">
                    <div className="text-sm text-gray-500">Sessions</div>
                    <div className="font-medium text-gray-700">{counsellor.totalSessions}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
