import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Volume2, VolumeX, Calendar, MessageCircle, BookOpen, Activity, Brain, Heart, Users, Bell, Settings, ChevronRight, Clock, Star, TrendingUp, Shield, Zap, Target, Play, Pause, Download, CheckCircle, AlertCircle, User, Video, Phone, Headphones, SkipBack, SkipForward, Volume1, HelpCircle } from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";
import { useSessionStore } from "../stores/useSessionStore";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { upcomingSessions, previousSessions, isLoading, getStudentSessions, cancelSession } = useSessionStore();

  const [activeSessionTab, setActiveSessionTab] = useState("upcoming");
  const [chatSummary, setChatSummary] = useState(null);
  const [moodScore, setMoodScore] = useState(7.2);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weeklyGoals, setWeeklyGoals] = useState({
    meditation: { current: 4, target: 7 },
    sessions: { current: 2, target: 3 },
    resources: { current: 8, target: 10 }
  });
  // At the top of StudentDashboard
const weeklyResources = {
  Sunday: [
    { id: 1, title: "Mindful Sunday", description: "Relax with guided meditation.", category: "Meditation", difficulty: "Easy", icon: "🧘", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: 2, title: "Calm Beats", description: "Lo-fi music to recharge.", category: "Music", difficulty: "Easy", icon: "🎶", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: 3, title: "Nature Sounds", description: "Birds and rivers for peace.", category: "Relax", difficulty: "Easy", icon: "🌿", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { id: 4, title: "Sunday Reflections", description: "Inspirational talk for a fresh week.", category: "Speech", difficulty: "Medium", icon: "🎤", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  ],
  Monday: [
    { id: 1, title: "Focus Monday", description: "Boost productivity with focus music.", category: "Study", difficulty: "Medium", icon: "📘", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
    { id: 2, title: "Motivation Boost", description: "Morning motivation talk.", category: "Speech", difficulty: "Easy", icon: "🎤", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
    { id: 3, title: "Coding Beats", description: "Lo-fi for developers.", category: "Music", difficulty: "Easy", icon: "💻", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
    { id: 4, title: "Stress Relief", description: "Breathing exercises for stress.", category: "Health", difficulty: "Easy", icon: "💨", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  ],
  Tuesday: [
    { id: 1, title: "Mindful Sunday", description: "Relax with guided meditation.", category: "Meditation", difficulty: "Easy", icon: "🧘", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: 2, title: "Calm Beats", description: "Lo-fi music to recharge.", category: "Music", difficulty: "Easy", icon: "🎶", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: 3, title: "Nature Sounds", description: "Birds and rivers for peace.", category: "Relax", difficulty: "Easy", icon: "🌿", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { id: 4, title: "Sunday Reflections", description: "Inspirational talk for a fresh week.", category: "Speech", difficulty: "Medium", icon: "🎤", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  ],
  Wednesday: [
    { id: 1, title: "Mindful Sunday", description: "Relax with guided meditation.", category: "Meditation", difficulty: "Easy", icon: "🧘", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: 2, title: "Calm Beats", description: "Lo-fi music to recharge.", category: "Music", difficulty: "Easy", icon: "🎶", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: 3, title: "Nature Sounds", description: "Birds and rivers for peace.", category: "Relax", difficulty: "Easy", icon: "🌿", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { id: 4, title: "Sunday Reflections", description: "Inspirational talk for a fresh week.", category: "Speech", difficulty: "Medium", icon: "🎤", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  ],
  Thursday: [
    { id: 1, title: "Focus Monday", description: "Boost productivity with focus music.", category: "Study", difficulty: "Medium", icon: "📘", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
    { id: 2, title: "Motivation Boost", description: "Morning motivation talk.", category: "Speech", difficulty: "Easy", icon: "🎤", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
    { id: 3, title: "Coding Beats", description: "Lo-fi for developers.", category: "Music", difficulty: "Easy", icon: "💻", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
    { id: 4, title: "Stress Relief", description: "Breathing exercises for stress.", category: "Health", difficulty: "Easy", icon: "💨", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  ],
  Friday: [
    { id: 1, title: "Mindful Sunday", description: "Relax with guided meditation.", category: "Meditation", difficulty: "Easy", icon: "🧘", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: 2, title: "Calm Beats", description: "Lo-fi music to recharge.", category: "Music", difficulty: "Easy", icon: "🎶", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: 3, title: "Nature Sounds", description: "Birds and rivers for peace.", category: "Relax", difficulty: "Easy", icon: "🌿", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { id: 4, title: "Sunday Reflections", description: "Inspirational talk for a fresh week.", category: "Speech", difficulty: "Medium", icon: "🎤", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  ],
  Saturday: [
    { id: 1, title: "Focus Monday", description: "Boost productivity with focus music.", category: "Study", difficulty: "Medium", icon: "📘", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
    { id: 2, title: "Motivation Boost", description: "Morning motivation talk.", category: "Speech", difficulty: "Easy", icon: "🎤", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
    { id: 3, title: "Coding Beats", description: "Lo-fi for developers.", category: "Music", difficulty: "Easy", icon: "💻", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
    { id: 4, title: "Stress Relief", description: "Breathing exercises for stress.", category: "Health", difficulty: "Easy", icon: "💨", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  ],
};

const [today, setToday] = useState("");
const [todaysResources, setTodaysResources] = useState([]);

useEffect(() => {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const currentDay = days[new Date().getDay()];
  setToday(currentDay);
  setTodaysResources(weeklyResources[currentDay] || []);
}, []);


  // Audio states
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime_audio, setCurrentTime_audio] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Audio effects
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime_audio(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentlyPlaying(null);
      setCurrentTime_audio(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentlyPlaying]);

  // Mock fetch for demo
  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await fetch("http://localhost:5000/api/chat/summary/last");
        if (response.ok) {
          const data = await response.json();
          setChatSummary(data.summary);
        } else {
          throw new Error("API not available");
        }
      } catch (error) {
        setChatSummary([
          "Practice 5 minutes of deep breathing daily",
          "Take regular breaks during study sessions", 
          "Maintain a consistent sleep schedule",
          "Connect with friends and family regularly"
        ]);
      }
    }
    fetchSummary();
  }, []);

  // Fetch real sessions on mount
  useEffect(() => {
    if (user?.anonymous_id) {
      getStudentSessions(user.anonymous_id);
    }
  }, [user?.anonymous_id]);

  // ── Session helpers ──────────────────────────────────────────────────────

  const getSessionTimes = (session) => {
    const dateStr = new Date(session.date).toISOString().split('T')[0];
    // Parse slot string like "10:30 AM"
    const [timePart, period] = session.slot.split(' ');
    let [h, m] = timePart.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const slotStart = new Date(`${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);
    return { slotStart, slotEnd };
  };

  /**
   * Given a session from the store, compute its real-time display status.
   * Upcoming: > 10 min before start
   * Ready to Join: within 10 min before start up to session end (start + 30 min)
   * In Progress: past start but within 30-min window
   * Completed: past session end
   */
  const getSessionDisplayStatus = (session) => {
    const { slotStart, slotEnd } = getSessionTimes(session);
    const now = currentTime;
    if (now > slotEnd) return 'completed';
    if (now >= slotStart && now <= slotEnd) return 'in-progress';
    if (now >= new Date(slotStart.getTime() - 10 * 60 * 1000) && now < slotStart) return 'ready';
    return 'upcoming';
  };

  const formatSessionDate = (session) => {
    const d = new Date(session.date);
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    const dateLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow'
      : d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    return `${dateLabel} at ${session.slot}`;
  };

  const handleCancelSession = async (sessionId) => {
    const confirmed = window.confirm('Are you sure you want to cancel this session? This cannot be undone.');
    if (!confirmed) return;
    await cancelSession(sessionId);
  };

  // Dynamically separate active and expired upcoming sessions
  const activeUpcomingSessions = upcomingSessions.filter(s => getSessionDisplayStatus(s) !== 'completed');
  
  // Combine natively previous sessions with upcoming sessions that have expired based on current time
  const dynamicallyExpiredSessions = upcomingSessions
    .filter(s => getSessionDisplayStatus(s) === 'completed')
    .map(s => ({ ...s, status: 'completed' })); // force status to completed for UI

  const combinedPreviousSessions = [...dynamicallyExpiredSessions, ...previousSessions].sort((a, b) => {
    const aTime = getSessionTimes(a).slotStart.getTime();
    const bTime = getSessionTimes(b).slotStart.getTime();
    return bTime - aTime; // most recent first
  });

  const quickActions = [
    { title: "AI Chatbot", description: "Get instant support", icon: <Brain className="w-6 h-6" />, color: "from-blue-500 to-blue-600", urgent: false },
    { title: "Book Session", description: "Schedule with counselor", icon: <Calendar className="w-6 h-6" />, color: "from-green-500 to-green-600", urgent: false },
    { title: "Support", description: "Get help and guidance", icon: <HelpCircle className="w-6 h-6" />, color: "from-purple-500 to-purple-600", urgent: false }
  ];

  

  // Audio control functions
  const playAudio = (resource) => {
    if (currentlyPlaying && currentlyPlaying.id !== resource.id) {
      // Stop current audio
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (currentlyPlaying?.id === resource.id && isPlaying) {
      // Pause current audio
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Play new or resumed audio
      setCurrentlyPlaying(resource);
      audioRef.current.src = resource.audioUrl;
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentlyPlaying(null);
      setCurrentTime_audio(0);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  };

  const handleProgressClick = (e) => {
    if (audioRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickRatio = clickX / rect.width;
      audioRef.current.currentTime = clickRatio * duration;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatAudioTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const routes = {
    "AI Chatbot": "/chatbot",
    "Book Session": "/booking",
    "Support": "/support",
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleNavigation = (path) => {
    console.log(`Navigating to ${path}`);
  };

  const navigate = useNavigate();

  const getCategoryColor = (category) => {
    const colors = {
      meditation: "from-purple-400 to-purple-600",
      "stress-relief": "from-green-400 to-green-600", 
      sleep: "from-indigo-400 to-indigo-600",
      focus: "from-orange-400 to-orange-600"
    };
    return colors[category] || "from-gray-400 to-gray-600";
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      Beginner: "bg-green-100 text-green-700",
      Intermediate: "bg-yellow-100 text-yellow-700",
      Advanced: "bg-red-100 text-red-700"
    };
    return badges[difficulty] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} />
      
      {/* Background Pattern with Blue Patches - Same as HomePage */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full opacity-40 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-sky-100 to-sky-200 rounded-full opacity-30 -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-3/4 w-72 h-72 bg-gradient-to-tr from-indigo-100 to-indigo-200 rounded-full opacity-35 translate-y-1/3"></div>
        <div className="absolute bottom-1/3 left-3/4 w-64 h-64 bg-gradient-to-bl from-cyan-100 to-cyan-200 rounded-full opacity-30"></div>
      </div>

      {/* Header Section */}
      <div className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-r from-white/50 to-blue-50/30 rounded-2xl"></div>
            <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100 p-6 shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl">
                    👨‍🎓
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                      {getGreeting()}, <span className="bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">{user.name} ("{user.anonymous_id}")</span>
                    </h1>
                    <p className="text-gray-600">How are you feeling today?</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Current time</p>
                    <p className="font-semibold text-gray-800">{formatTime(currentTime)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors">
                      <Bell className="w-5 h-5 text-blue-600" />
                    </button>
                    <button 
                      className="p-2 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors"
                      onClick={() => navigate('/student-profile')}
                    >
                      <Settings className="w-5 h-5 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Player Controls - Fixed at bottom when playing */}
      {currentlyPlaying && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-4 z-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              {/* Audio Info */}
              <div className="flex items-center space-x-3 flex-1">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${getCategoryColor(currentlyPlaying.category)}`}>
                  <div className="text-white">
                    {currentlyPlaying.icon}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{currentlyPlaying.title}</h4>
                  <p className="text-sm text-gray-600">{currentlyPlaying.description}</p>
                </div>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={skipBackward}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <SkipBack className="w-5 h-5 text-gray-600" />
                </button>

                <button
                  onClick={() => playAudio(currentlyPlaying)}
                  className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                <button
                  onClick={skipForward}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <SkipForward className="w-5 h-5 text-gray-600" />
                </button>

                <button
                  onClick={stopAudio}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 mx-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <span>{formatAudioTime(currentTime_audio)}</span>
                  <span>/</span>
                  <span>{formatAudioTime(duration)}</span>
                </div>
                <div
                  ref={progressRef}
                  onClick={handleProgressClick}
                  className="h-2 bg-gray-200 rounded-full cursor-pointer group"
                >
                  <div
                    className="h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all group-hover:shadow-lg"
                    style={{ width: `${duration ? (currentTime_audio / duration) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Volume & Speed Controls */}
              <div className="flex items-center space-x-3">
                {/* Playback Speed */}
                <div className="flex items-center space-x-1">
                  {[0.75, 1, 1.25, 1.5].map(rate => (
                    <button
                      key={rate}
                      onClick={() => handlePlaybackRateChange(rate)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        playbackRate === rate 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <button onClick={toggleMute} className="p-1 hover:bg-gray-100 rounded">
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-gray-600" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 px-6 pb-8" style={{ marginBottom: currentlyPlaying ? '120px' : '0' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Mood & Weekly Progress */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mood Tracker */}
                <div className="relative group">
                  <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-white/50 to-green-50/30 rounded-2xl"></div>
                  <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-green-100 p-6 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">Today's Mood</h3>
                      <Heart className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {moodScore}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-200 h-2 rounded-full">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
                            style={{ width: `${(moodScore / 10) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Feeling positive today! 🌟</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly Goals */}
                <div className="relative group">
                  <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-white/50 to-purple-50/30 rounded-2xl"></div>
                  <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-purple-100 p-6 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">Weekly Goals</h3>
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="space-y-3">
                      {Object.entries(weeklyGoals).map(([key, goal]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize text-gray-600">{key}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{goal.current}/{goal.target}</span>
                            <div className="w-16 bg-gray-200 h-1.5 rounded-full">
                              <div
                                className="bg-gradient-to-r from-purple-400 to-purple-500 h-1.5 rounded-full"
                                style={{ width: `${(goal.current / goal.target) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Sessions (Tabbed) ───────────────────────────────────────────── */}
              <div className="relative group">
                <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-white/50 to-blue-50/30 rounded-2xl"></div>
                <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100 p-6 hover:shadow-xl transition-all">
                  
                  {/* Tabs Header */}
                  <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
                    <button 
                      onClick={() => setActiveSessionTab('upcoming')}
                      className={`flex items-center gap-2 pb-3 px-1 text-lg font-semibold transition-colors relative ${
                        activeSessionTab === 'upcoming' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Upcoming Sessions
                      {activeUpcomingSessions.length > 0 && (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          activeSessionTab === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {activeUpcomingSessions.length}
                        </span>
                      )}
                      {activeSessionTab === 'upcoming' && (
                        <div className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                      )}
                    </button>

                    <button 
                      onClick={() => setActiveSessionTab('previous')}
                      className={`flex items-center gap-2 pb-3 px-1 text-lg font-semibold transition-colors relative ${
                        activeSessionTab === 'previous' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Previous Sessions
                      {combinedPreviousSessions.length > 0 && (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          activeSessionTab === 'previous' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {combinedPreviousSessions.length}
                        </span>
                      )}
                      {activeSessionTab === 'previous' && (
                        <div className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-gray-800 rounded-t-full"></div>
                      )}
                    </button>
                    
                    <div className="ml-auto pb-3 text-gray-400">
                      {activeSessionTab === 'upcoming' ? <Calendar className="w-5 h-5 text-blue-500" /> : <CheckCircle className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  {/* Tab Content: Upcoming Sessions */}
                  {activeSessionTab === 'upcoming' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                     style={{height:"400px"}}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                      ) : activeUpcomingSessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400"
                        style={{height:"400px"}}
                        >
                          <Calendar className="w-12 h-12 mb-3 text-gray-300" />
                          <p className="font-medium text-gray-500">No upcoming appointments.</p>
                          <Link to="/booking" className="mt-2 text-sm text-blue-500 hover:underline">Book a session now →</Link>
                        </div>
                      ) : (
                        <div
                          className="space-y-3 overflow-y-auto pr-1"
                          style={{ height: '400px', scrollbarWidth: 'thin', scrollbarColor: '#bfdbfe transparent' }}
                        >
                          {activeUpcomingSessions.map((session) => {
                            const displayStatus = getSessionDisplayStatus(session);
                            const statusConfig = {
                              'upcoming':    { label: 'Upcoming',      badge: 'bg-blue-100 text-blue-700' },
                              'ready':       { label: 'Ready to Join', badge: 'bg-green-100 text-green-700' },
                              'in-progress': { label: 'In Progress',   badge: 'bg-amber-100 text-amber-700' },
                            }[displayStatus];

                            return (
                              <div key={session._id} className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-blue-50 hover:bg-white/80 hover:shadow-sm transition-all">
                                <div className="text-2xl mt-1">🧑‍⚕️</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-gray-800 truncate">{session.c_name}</h4>
                                    <span className={`shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${statusConfig.badge}`}>
                                      {statusConfig.label}
                                    </span>
                                  </div>
                                  <p className="text-sm text-blue-600 font-medium">Licensed Counselor</p>
                                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{formatSessionDate(session)}</span>
                                    <span className="mx-1">·</span>
                                    <span>30 min</span>
                                    <span className="mx-1">·</span>
                                    {session.session_type === 'voice' ? <Phone className="w-3.5 h-3.5 inline" /> : session.session_type === 'chat' ? <MessageCircle className="w-3.5 h-3.5 inline" /> : <Video className="w-3.5 h-3.5 inline" />}
                                    <span className="ml-0.5">{session.session_type === 'voice' ? 'Voice' : session.session_type === 'chat' ? 'Chat' : 'Video'}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">ID: {session.session_id || '—'}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  {(displayStatus === 'ready' || displayStatus === 'in-progress') && (
                                    <Link
                                      to={`/session/${session.session_link.split('/').pop()}`}
                                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:scale-105 transform transition-all"
                                    >
                                      Join Now
                                    </Link>
                                  )}
                                  {displayStatus === 'upcoming' && (
                                    <button
                                      disabled
                                      className="px-4 py-2 bg-gray-100 text-gray-400 cursor-not-allowed rounded-lg text-sm font-medium"
                                    >
                                      Join
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleCancelSession(session._id)}
                                    className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab Content: Previous Sessions */}
                  {activeSessionTab === 'previous' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                     style={{height:"400px"}}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                        </div>
                      ) : combinedPreviousSessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400"
                          style={{height:"400px"}}
                        >
                          <CheckCircle className="w-12 h-12 mb-3 text-gray-200" />
                          <p className="font-medium text-gray-400">No previous sessions found.</p>
                        </div>
                      ) : (
                        <div
                          className="space-y-3 overflow-y-auto pr-1"
                          style={{ height: '400px', scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
                        >
                          {combinedPreviousSessions.map((session) => {
                            const isCompleted = session.status === 'completed';
                            return (
                              <div key={session._id} className="flex items-start gap-4 p-4 bg-white/50 rounded-xl border border-gray-100 hover:bg-white/70 transition-all opacity-90">
                                <div className="text-2xl mt-1 grayscale">🧑‍⚕️</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-gray-700 truncate">{session.c_name}</h4>
                                    <span className={`shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${
                                      isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                      {isCompleted ? 'Completed' : 'Cancelled'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500">Licensed Counselor</p>
                                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{formatSessionDate(session)}</span>
                                    <span className="mx-1">·</span>
                                    <span>30 min</span>
                                    <span className="mx-1">·</span>
                                    {session.session_type === 'voice' ? <Phone className="w-3.5 h-3.5 inline" /> : session.session_type === 'chat' ? <MessageCircle className="w-3.5 h-3.5 inline" /> : <Video className="w-3.5 h-3.5 inline" />}
                                    <span className="ml-0.5">{session.session_type === 'voice' ? 'Voice' : session.session_type === 'chat' ? 'Chat' : 'Video'}</span>
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  {isCompleted ? (
                                    <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 font-medium">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      Feedback Pending
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-sm text-gray-400">
                                      <AlertCircle className="w-4 h-4" />
                                      Cancelled
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* AI Chat Summary */}
              <div className="relative group">
                <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-white/50 to-indigo-50/30 rounded-2xl"></div>
                <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-indigo-100 p-6 hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Recent AI Insights</h2>
                    <Brain className="w-5 h-5 text-indigo-600" />
                  </div>
                  {chatSummary ? (
                    <div className="space-y-3">
                      {chatSummary.map((point, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-white/40 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{point}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 italic">Start a chat to see personalized insights</p>
                      <button
                        onClick={() => navigate('/chatbot')}
                        className="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
                      >
                        Start Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Actions */}
              <div className="relative group">
                <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-white/50 to-blue-50/30 rounded-2xl"></div>
                <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100 p-6 hover:shadow-xl transition-all">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const path = routes[action.title] || "/";
                          navigate(path);
                        }}
                        className={`group flex items-center p-4 rounded-xl transition-all transform hover:scale-105 hover:shadow-lg w-full text-left ${
                          action.urgent 
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                            : `bg-gradient-to-r ${action.color} text-white`
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {action.icon}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="font-medium">{action.title}</p>
                          <p className="text-sm opacity-90">{action.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Today's Audio Resources */}
<div className="relative group">
  <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-white/50 to-cyan-50/30 rounded-xl"></div>
  <div className="relative bg-white/70 backdrop-blur-sm rounded-xl border border-cyan-100 p-4 md:p-5 hover:shadow-lg transition-all">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-base md:text-lg font-semibold text-gray-800">
        Today's Audio Resources
      </h3>
      <Headphones className="w-4 h-4 md:w-5 md:h-5 text-cyan-600" />
    </div>

    {/* Currently Playing Info */}
    {currentlyPlaying && (
      <div className="mb-3 p-2 md:p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
        <div className="flex items-center space-x-2 text-xs md:text-sm text-blue-700">
          <Volume2 className="w-3 h-3 md:w-4 md:h-4" />
          <span>Playing: {currentlyPlaying.title}</span>
        </div>
      </div>
    )}

    {/* Resource List */}
    <div className="space-y-3">
      {todaysResources.map((resource) => (
  <div
    key={resource.id}
    className="flex items-center p-3 bg-white/50 rounded-lg border border-cyan-50 hover:bg-white/70 transition-all"
  >
    <div className={`flex-shrink-0 p-2.5 md:p-3 rounded-lg bg-gradient-to-r ${getCategoryColor(resource.category)}`}>
      <div className="text-white w-4 h-4 md:w-5 md:h-5">{resource.icon}</div>
    </div>

    <div className="ml-3 flex-1">
      <div className="flex items-center space-x-2 mb-0.5">
        <p className="font-medium text-gray-800 text-xs md:text-sm">{resource.title}</p>
        <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${getDifficultyBadge(resource.difficulty)}`}>
          {resource.difficulty}
        </span>
      </div>
      <p className="text-gray-600 text-[11px] md:text-sm">{resource.description}</p>
    </div>

    <button
      onClick={() => playAudio(resource)}
      className="ml-2 p-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-md transition-all"
    >
      {currentlyPlaying?.id === resource.id && isPlaying ? (
        <Pause className="w-4 h-4 md:w-5 md:h-5" />
      ) : (
        <Play className="w-4 h-4 md:w-5 md:h-5" />
      )}
    </button>
  </div>
))}

    </div>
    <button onClick={() => navigate('/resources')} className="inline-flex items-center text-cyan-600 hover:text-cyan-700 font-medium text-sm mt-4 group" > View all resources <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /> </button>
  </div>
</div>


              {/* Emergency Support */}
              <div className="relative group">
                <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-white/50 to-red-50/30 rounded-2xl"></div>
                <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-red-100 p-6 hover:shadow-xl transition-all">
                  <div className="flex items-center mb-3">
                    <Shield className="w-5 h-5 text-red-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">Need Help Now?</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    If you're in crisis, help is available 24/7
                  </p>
                  <div className="space-y-2">
                    <button 
                      onClick={() => navigate('/booking')}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all"
                    >
                      Crisis Helpline
                    </button>
                    <button 
                      onClick={() => navigate('/contact')}
                      className="w-full bg-white border border-red-200 text-red-600 py-2 rounded-lg font-medium hover:bg-red-50 transition-all"
                    >
                      Emergency Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}