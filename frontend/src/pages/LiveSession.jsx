import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import socket from "../socket/socket";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff,
  MessageCircle, X, Send, Circle, Wifi, WifiOff, Download,
  Users, Clock, Phone, ShieldX, Loader2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const SESSION_TYPE_LABELS = { video: "Video Call", voice: "Voice Call", chat: "Text Chat" };

// ─── Component ────────────────────────────────────────────────────────────────
export default function LiveSession() {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // ── Auth / session info state ──
  // "loading" | "authorized" | "denied" | "error"
  const [authState,   setAuthState]   = useState("loading");
  const [sessionType, setSessionType] = useState("video"); // fetched from backend

  // ── Media refs ──
  const localVideoRef   = useRef(null);
  const remoteVideoRef  = useRef(null);
  const peerConnection  = useRef(null);
  const localStreamRef  = useRef(null);
  const screenPreviewStreamRef = useRef(null);
  const pendingCandidates  = useRef([]);
  const offerCreated       = useRef(false);
  const mediaRecorderRef   = useRef(null);
  const recordedChunksRef  = useRef([]);
  const statsIntervalRef   = useRef(null);
  const durationIntervalRef = useRef(null);
  const chatEndRef         = useRef(null);

  // ── UI state ──
  const [micEnabled,      setMicEnabled]     = useState(false); // set after auth
  const [cameraEnabled,   setCameraEnabled]  = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording,     setIsRecording]    = useState(false);
  const [chatOpen,        setChatOpen]       = useState(false);
  const [messages,        setMessages]       = useState([]);
  const [chatInput,       setChatInput]      = useState("");
  const [unreadCount,     setUnreadCount]    = useState(0);

  // ── Session state ──
  const [participants,    setParticipants]    = useState([]);
  const [remoteName,      setRemoteName]      = useState("");
  const [remoteVideoOff,  setRemoteVideoOff]  = useState(false);
  const [sessionStarted,  setSessionStarted]  = useState(false);
  const [duration,        setDuration]        = useState(0);
  const [connectionQuality, setConnectionQuality] = useState("connecting");
  const [peerLeft,        setPeerLeft]        = useState(false);

  const displayName = user?.name || user?.c_name || (user?.role === "counsellor" ? "Counsellor" : "Student");

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Step 1: Verify authorization & fetch session type ─────────────────────
  useEffect(() => {
    if (!user) return;

    const verifyAndInit = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/session/info/${roomName}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (res.status === 403) {
          setAuthState("denied");
          return;
        }
        if (!res.ok) {
          setAuthState("error");
          return;
        }

        const fetchedType = data.session_type || "video";
        setSessionType(fetchedType);
        setAuthState("authorized");

        // Auto-open chat for chat sessions
        if (fetchedType === "chat") setChatOpen(true);

        // Set initial mic/camera state based on session type
        // video → cam+mic ON | voice → cam OFF mic ON | chat → cam OFF mic OFF
        const initMic    = fetchedType !== "chat";
        const initCamera = fetchedType === "video";
        setMicEnabled(initMic);
        setCameraEnabled(initCamera);
        setRemoteVideoOff(!initCamera);

      } catch {
        setAuthState("error");
      }
    };

    verifyAndInit();
  }, [roomName, user]);

  // ── Fetch ICE servers ──────────────────────────────────────────────────────
  const getIceServers = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/session/turn-credentials`, { credentials: "include" });
      const data = await res.json();
      return data.iceServers || [];
    } catch {
      return [{ urls: "stun:stun.l.google.com:19302" }];
    }
  }, []);

  // ── Create RTCPeerConnection ───────────────────────────────────────────────
  const createPeerConnection = useCallback(async () => {
    const iceServers = await getIceServers();
    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("ice-candidate", { roomName, candidate });
    };

    pc.ontrack = ({ streams }) => {
      if (remoteVideoRef.current && streams[0]) {
        remoteVideoRef.current.srcObject = streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected")                          setConnectionQuality("good");
      if (state === "disconnected" || state === "failed") setConnectionQuality("disconnected");
    };

    peerConnection.current = pc;

    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    statsIntervalRef.current = setInterval(async () => {
      if (!peerConnection.current) return;
      try {
        const stats = await peerConnection.current.getStats();
        let rtt = null;
        stats.forEach((r) => {
          if (r.type === "candidate-pair" && r.state === "succeeded" && r.currentRoundTripTime) {
            rtt = r.currentRoundTripTime * 1000;
          }
        });
        if (rtt === null) return;
        if (rtt < 100)      setConnectionQuality("good");
        else if (rtt < 300) setConnectionQuality("fair");
        else                setConnectionQuality("poor");
      } catch { /* ignore */ }
    }, 5000);

    return pc;
  }, [roomName, getIceServers]);

  // ── Drain pending ICE candidates ──────────────────────────────────────────
  const drainPendingCandidates = useCallback(async (pc) => {
    for (const c of pendingCandidates.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
    }
    pendingCandidates.current = [];
  }, []);

  const attachLocalPreview = useCallback(async (stream = localStreamRef.current, force = false) => {
    const video = localVideoRef.current;
    if (!video || !stream) return;

    if (force) {
      video.srcObject = null;
      await Promise.resolve();
    }

    if (video.srcObject !== stream) video.srcObject = stream;
    try { await video.play(); } catch { /* autoplay can still be settling */ }
  }, []);

  const emitMediaState = useCallback(() => {
    const stream = localStreamRef.current;
    socket.emit("media-state", {
      roomName,
      audioEnabled: stream?.getAudioTracks()[0]?.enabled ?? false,
      videoEnabled: stream?.getVideoTracks()[0]?.enabled ?? false,
    });
  }, [roomName]);

  // ── Step 2: Init media + WebRTC (runs only after auth is confirmed) ────────
  useEffect(() => {
    if (authState !== "authorized") return;

    let cleanedUp = false;

    const init = async () => {
      // ✅ KEY FIX: Always request BOTH video+audio regardless of session type.
      // We disable individual tracks below. This avoids PeerConnection renegotiation
      // when the user later enables camera in a voice/chat session.
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        // Camera not available — try audio only
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch {
          alert("Please allow microphone access to join the session.");
          navigate(`/${user?.role}-dashboard`);
          return;
        }
      }

      if (cleanedUp) { stream.getTracks().forEach((t) => t.stop()); return; }

      // Apply initial track states based on session type
      // sessionType is already set in authState effect, read it from state ref
      const currentType = sessionType; // captured at effect run time

      stream.getAudioTracks().forEach((t) => { t.enabled = (currentType !== "chat"); });
      stream.getVideoTracks().forEach((t) => { t.enabled = (currentType === "video"); });

      localStreamRef.current = stream;

      // Attach to local video element (always — visibility controlled by cameraEnabled state)
      attachLocalPreview(stream);

      // Create PC and add tracks
      const pc = await createPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // Connect socket
      if (!socket.connected) socket.connect();

      const joinRoom = () => {
        socket.emit("join-room", {
          roomName,
          userId: user._id,
          name: displayName,
          role: user.role,
        });
      };

      socket.on("connect", joinRoom);
      if (socket.connected) joinRoom();

      socket.on("room-error", (msg) => {
        alert(msg);
        navigate(`/${user.role}-dashboard`);
      });

      socket.on("room-full", () => {
        alert("This session already has two participants.");
        navigate(`/${user.role}-dashboard`);
      });

      const handleRoomUsers = async ({ users }) => {
        setParticipants(users);
        const remote = users.find((u) => u.userId !== user._id);
        if (remote) setRemoteName(remote.name);

        if (users.length === 2 && user.role === "student" && !offerCreated.current) {
          offerCreated.current = true;
          try {
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            socket.emit("offer", { roomName, offer });
          } catch { /* ignore */ }
        }
      };
      socket.on("room-users", handleRoomUsers);

      socket.on("session-started", () => {
        setSessionStarted(true);
        setPeerLeft(false);
        emitMediaState();
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      });

      socket.on("offer", async (offer) => {
        if (!peerConnection.current) return;
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
          await drainPendingCandidates(peerConnection.current);
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socket.emit("answer", { roomName, answer });
        } catch { /* ignore */ }
      });

      socket.on("answer", async (answer) => {
        if (!peerConnection.current) return;
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
          await drainPendingCandidates(peerConnection.current);
        } catch { /* ignore */ }
      });

      socket.on("ice-candidate", async (candidate) => {
        if (peerConnection.current?.remoteDescription) {
          try { await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)); }
          catch { /* ignore */ }
        } else {
          pendingCandidates.current.push(candidate);
        }
      });

      socket.on("peer-left", ({ name }) => {
        setPeerLeft(true);
        setSessionStarted(false);
        setRemoteName(name || "Other participant");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        offerCreated.current = false;
        pendingCandidates.current = [];
      });

      socket.on("peer-media-state", ({ videoEnabled }) => {
        setRemoteVideoOff(!videoEnabled);
      });

      socket.on("chat-message", ({ message, senderName, timestamp }) => {
        setMessages((prev) => [...prev, { message, senderName, timestamp, self: false }]);
        setChatOpen((open) => {
          if (!open) setUnreadCount((c) => c + 1);
          return open;
        });
      });
    };

    init();

    return () => {
      cleanedUp = true;
      const localVideoEl = localVideoRef.current;
      const remoteVideoEl = remoteVideoRef.current;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (localVideoEl)  localVideoEl.srcObject = null;
      if (remoteVideoEl) remoteVideoEl.srcObject = null;
      screenPreviewStreamRef.current = null;
      if (statsIntervalRef.current)    clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      peerConnection.current?.close();
      peerConnection.current = null;
      ["connect","room-error","room-full","room-users","session-started",
       "offer","answer","ice-candidate","peer-left","peer-media-state","chat-message"].forEach((e) => socket.off(e));
      offerCreated.current = false;
      pendingCandidates.current = [];
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState]);

  // ── Toggle Mic ────────────────────────────────────────────────────────────
  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
    emitMediaState();
  };

  // ── Toggle Camera ─────────────────────────────────────────────────────────
  // ✅ FIX: Since we always request video+audio upfront, the track always exists.
  // We just toggle track.enabled — no renegotiation needed.
  const toggleCamera = async () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];

    if (videoTrack) {
      // Track exists — simple enable/disable toggle
      videoTrack.enabled = !videoTrack.enabled;
      const nowEnabled = videoTrack.enabled;
      setCameraEnabled(nowEnabled);

      // ✅ Force video element to reinitialize by assigning a fresh MediaStream
      await attachLocalPreview(new MediaStream(stream.getTracks()), true);

      emitMediaState();
    } else {
      // Fallback: camera wasn't available at start — request it now
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = camStream.getVideoTracks()[0];
        stream.addTrack(newTrack);
        const sender = peerConnection.current?.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(newTrack);
        else peerConnection.current?.addTrack(newTrack, stream);

        await attachLocalPreview(new MediaStream(stream.getTracks()), true);
        setCameraEnabled(true);
        emitMediaState();
      } catch {
        alert("Could not access camera.");
      }
    }
  };

  // ── Screen Share ──────────────────────────────────────────────────────────
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      const sender = peerConnection.current?.getSenders().find((s) => s.track?.kind === "video");
      if (videoTrack) {
        videoTrack.enabled = cameraEnabled; // restore to previous state
        if (sender) await sender.replaceTrack(videoTrack);
      }
      screenPreviewStreamRef.current = null;
      await attachLocalPreview(new MediaStream(localStreamRef.current.getTracks()), true);
      socket.emit("screen-share-stopped", { roomName });
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.current?.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(screenTrack);

        const previewStream = new MediaStream([
          screenTrack,
          ...(localStreamRef.current?.getAudioTracks() || []),
        ]);
        screenPreviewStreamRef.current = previewStream;
        await attachLocalPreview(previewStream, true);
        screenTrack.onended = () => { setIsScreenSharing((v) => { if (v) toggleScreenShare(); return v; }); };
        socket.emit("screen-share-started", { roomName });
        setIsScreenSharing(true);
      } catch { /* user cancelled */ }
    }
  };

  // ── Recording ─────────────────────────────────────────────────────────────
  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      const localAudio  = localStreamRef.current?.getAudioTracks()          || [];
      const remoteAudio = remoteVideoRef.current?.srcObject?.getAudioTracks() || [];
      const videoTrack  = localStreamRef.current?.getVideoTracks()[0];
      const combined = new MediaStream([...localAudio, ...remoteAudio, ...(videoTrack ? [videoTrack] : [])]);

      recordedChunksRef.current = [];
      const mr = new MediaRecorder(combined, { mimeType: "video/webm;codecs=vp8,opus" });
      mr.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url; a.download = `SoulCare-${roomName}-${Date.now()}.webm`; a.click();
        URL.revokeObjectURL(url);
      };
      mr.start(200);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    }
  };

  // ── Chat ──────────────────────────────────────────────────────────────────
  const sendMessage = () => {
    const msg = chatInput.trim();
    if (!msg) return;
    const timestamp = Date.now();
    socket.emit("chat-message", { roomName, message: msg, senderName: displayName, senderId: user._id, timestamp });
    setMessages((prev) => [...prev, { message: msg, senderName: displayName, timestamp, self: true }]);
    setChatInput("");
  };

  const openChat = () => { setChatOpen(true); setUnreadCount(0); };

  // ── Leave ─────────────────────────────────────────────────────────────────
  const leaveCall = () => {
    mediaRecorderRef.current?.stop();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnection.current?.close();
    if (statsIntervalRef.current)    clearInterval(statsIntervalRef.current);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    socket.disconnect();
    navigate(`/${user?.role}-dashboard`);
  };

  // ── Connection quality badge ───────────────────────────────────────────────
  const qualityConfig = ({
    connecting:   { color: "text-yellow-400", label: "Connecting…" },
    good:         { color: "text-green-400",  label: "Good"        },
    fair:         { color: "text-yellow-400", label: "Fair"        },
    poor:         { color: "text-red-400",    label: "Poor"        },
    disconnected: { color: "text-gray-400",   label: "Disconnected"},
  })[connectionQuality] || { color: "text-gray-400", label: "—" };

  const showVideoUI = sessionType !== "chat" || cameraEnabled || isScreenSharing;
  const remoteCameraActive = sessionStarted && !peerLeft && !remoteVideoOff;
  const showChatOnlyPlaceholder = sessionType === "chat" && !cameraEnabled && !remoteCameraActive && sessionStarted;
  const showRemoteCameraOff = remoteVideoOff && sessionStarted && !peerLeft && !showChatOnlyPlaceholder;

  useEffect(() => {
    if (!showVideoUI) return;
    const previewStream = isScreenSharing ? screenPreviewStreamRef.current : localStreamRef.current;
    attachLocalPreview(previewStream);
  }, [showVideoUI, cameraEnabled, isScreenSharing, attachLocalPreview]);

  // ── Loading / Auth screens ─────────────────────────────────────────────────
  if (authState === "loading") {
    return (
      <div className="flex h-screen bg-gray-950 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
          <p className="text-lg font-medium">Verifying session access…</p>
        </div>
      </div>
    );
  }

  if (authState === "denied") {
    return (
      <div className="flex h-screen bg-gray-950 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white text-center px-6">
          <ShieldX className="w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-gray-400 max-w-sm">
            You are not a participant in this session. Only the booked student and their assigned counsellor can join.
          </p>
          <button
            onClick={() => navigate(`/${user?.role}-dashboard`)}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-medium transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (authState === "error") {
    return (
      <div className="flex h-screen bg-gray-950 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white text-center px-6">
          <ShieldX className="w-16 h-16 text-yellow-500" />
          <h2 className="text-2xl font-bold">Session Not Found</h2>
          <p className="text-gray-400">This session link may be invalid or expired.</p>
          <button
            onClick={() => navigate(`/${user?.role}-dashboard`)}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-medium transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex bg-gray-950 text-white overflow-hidden" style={{ height: "100dvh" }}>

      {/* ── Main column ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex-none flex items-center justify-between px-5 py-3 bg-gray-900/80 backdrop-blur border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="font-bold text-base">SoulCare</span>
            <span className="hidden sm:inline text-xs text-gray-500 font-mono truncate max-w-[160px]">{roomName}</span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-800 text-gray-300">
              {sessionType === "video" && <Video className="w-3 h-3" />}
              {sessionType === "voice" && <Phone className="w-3 h-3" />}
              {sessionType === "chat"  && <MessageCircle className="w-3 h-3" />}
              {SESSION_TYPE_LABELS[sessionType]}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {sessionStarted && (
              <div className="flex items-center gap-1.5 text-sm text-gray-300">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatDuration(duration)}</span>
              </div>
            )}
            <div className={`flex items-center gap-1.5 text-xs font-medium ${qualityConfig.color}`}>
              {connectionQuality === "disconnected" ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              <span className="hidden sm:inline">{qualityConfig.label}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Users className="w-4 h-4" />{participants.length}/2
            </div>
          </div>
        </div>

        {/* Video area */}
        <div className="flex-1 min-h-0 relative flex items-stretch bg-gray-950">
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">

            {/* Waiting overlay */}
            {!sessionStarted && !peerLeft && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
                <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-base font-semibold">Waiting for the other participant…</p>
                <p className="text-xs text-gray-400 mt-1">Share the session link to invite them</p>
              </div>
            )}

            {/* Peer left overlay */}
            {peerLeft && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold mb-4">
                  {getInitials(remoteName)}
                </div>
                <p className="text-base font-semibold">{remoteName} has left the call</p>
              </div>
            )}

            {/* Remote camera-off avatar */}
            {showRemoteCameraOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-4xl font-bold">
                  {getInitials(remoteName)}
                </div>
                <p className="mt-3 text-gray-300 text-sm">Camera is off</p>
              </div>
            )}

            {/* Chat-only placeholder */}
            {showChatOnlyPlaceholder && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-10">
                <MessageCircle className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-sm font-medium">Text Chat Session</p>
                <p className="text-gray-500 text-xs mt-1">Use the chat panel on the right to communicate</p>
                {!chatOpen && (
                  <button onClick={openChat} className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-sm rounded-full transition-all">
                    Open Chat
                  </button>
                )}
              </div>
            )}

            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

            {sessionStarted && (
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-medium z-20">
                {remoteName || "Participant"}
              </div>
            )}
          </div>

          {/* Local PiP — video element always in DOM, hidden via CSS when camera off */}
          {showVideoUI && (
            <div className="absolute bottom-4 right-4 w-40 h-28 sm:w-48 sm:h-36 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-gray-800 z-20">
              {/* ✅ Always rendered — never conditionally unmounted */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraEnabled ? "block" : "hidden"}`}
              />
              {!cameraEnabled && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base font-bold">
                    {getInitials(displayName)}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1">Camera off</span>
                </div>
              )}
              <div className="absolute bottom-1.5 left-2 text-[10px] bg-black/60 backdrop-blur px-2 py-0.5 rounded-full z-10">
                {displayName} (You)
              </div>
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="flex-none flex items-center justify-center gap-2 sm:gap-3 px-4 py-4 bg-gray-900/80 backdrop-blur border-t border-white/5">
          <button onClick={toggleMic} title={micEnabled ? "Mute" : "Unmute"}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${micEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-500"}`}>
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button onClick={toggleCamera} title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${cameraEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-500"}`}>
            {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button onClick={toggleScreenShare} title={isScreenSharing ? "Stop screen share" : "Share screen"}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-700 hover:bg-gray-600"}`}>
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </button>

          <button onClick={toggleRecording} title={isRecording ? "Stop recording" : "Start recording"}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isRecording ? "bg-rose-700 hover:bg-rose-600 animate-pulse" : "bg-gray-700 hover:bg-gray-600"}`}>
            {isRecording ? <Download className="w-5 h-5" /> : <Circle className="w-4 h-4 fill-red-500 text-red-500" />}
          </button>

          <button onClick={openChat} title="Open chat"
            className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all ${chatOpen ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-700 hover:bg-gray-600"}`}>
            <MessageCircle className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button onClick={leaveCall} title="Leave call"
            className="w-14 h-11 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-all">
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Chat sidebar ─────────────────────────────────────────────── */}
      {chatOpen && (
        <div className="w-72 sm:w-80 flex-none flex flex-col min-h-0 bg-gray-900 border-l border-white/5 overflow-hidden">
          <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="font-semibold text-sm">Session Chat</span>
            <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <p className="text-center text-gray-500 text-xs mt-8">No messages yet. Say hello!</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.self ? "items-end" : "items-start"}`}>
                <span className="text-[10px] text-gray-500 mb-1">{msg.senderName}</span>
                <div className={`max-w-[90%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${msg.self ? "bg-blue-600 rounded-br-sm" : "bg-gray-700 rounded-bl-sm"}`}>
                  {msg.message}
                </div>
                <span className="text-[10px] text-gray-600 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="flex-none flex items-center gap-2 px-3 py-3 border-t border-white/5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message…"
              className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
            <button onClick={sendMessage} disabled={!chatInput.trim()}
              className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center justify-center transition-all">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
