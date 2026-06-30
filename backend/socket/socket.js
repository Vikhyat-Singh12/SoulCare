import { Server } from "socket.io";

let io;

// roomName → Map<socketId, { socketId, userId, name, role, joinedAt }>
const activeRooms = new Map();

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // ── JOIN ROOM ──────────────────────────────────────────────────────────────
    socket.on("join-room", ({ roomName, userId, name, role }) => {
      if (!roomName || !userId || !role) return;

      if (!activeRooms.has(roomName)) {
        activeRooms.set(roomName, new Map());
      }

      const roomMap = activeRooms.get(roomName);

      // Enforce 1-student, 1-counsellor rule
      const existingRole = [...roomMap.values()].find((u) => u.role === role);
      if (existingRole) {
        socket.emit("room-error", `A ${role} is already in this session.`);
        return;
      }

      if (roomMap.size >= 2) {
        socket.emit("room-full");
        return;
      }

      // Store metadata on socket for disconnect cleanup
      socket.roomName = roomName;
      socket.userId = userId;
      socket.userRole = role;
      socket.userName = name;

      roomMap.set(socket.id, {
        socketId: socket.id,
        userId,
        name: name || (role === "counsellor" ? "Counsellor" : "Student"),
        role,
        joinedAt: Date.now(),
      });

      socket.join(roomName);

      console.log(`✅ ${role} "${name}" joined room: ${roomName}`);

      // Broadcast updated user list to everyone in the room
      const users = [...roomMap.values()];
      io.to(roomName).emit("room-users", { roomName, users });

      // If this is the 2nd person joining, tell everyone the session started
      if (roomMap.size === 2) {
        io.to(roomName).emit("session-started", { startedAt: Date.now() });
      }
    });

    // ── WEBRTC SIGNALLING ──────────────────────────────────────────────────────
    socket.on("offer", ({ roomName, offer }) => {
      socket.to(roomName).emit("offer", offer);
    });

    socket.on("answer", ({ roomName, answer }) => {
      socket.to(roomName).emit("answer", answer);
    });

    socket.on("ice-candidate", ({ roomName, candidate }) => {
      socket.to(roomName).emit("ice-candidate", candidate);
    });

    // ── SCREEN SHARE ────────────────────────────────────────────────────────────
    socket.on("screen-share-started", ({ roomName }) => {
      socket.to(roomName).emit("screen-share-started", { socketId: socket.id });
    });

    socket.on("screen-share-stopped", ({ roomName }) => {
      socket.to(roomName).emit("screen-share-stopped", { socketId: socket.id });
    });

    // ── CHAT ────────────────────────────────────────────────────────────────────
    socket.on("chat-message", ({ roomName, message, senderName, senderId, timestamp }) => {
      // Relay to everyone else in the room (not the sender)
      socket.to(roomName).emit("chat-message", {
        message,
        senderName,
        senderId,
        timestamp: timestamp || Date.now(),
      });
    });

    // ── MEDIA STATE (mic/camera toggle notifications) ──────────────────────────
    socket.on("media-state", ({ roomName, audioEnabled, videoEnabled }) => {
      socket.to(roomName).emit("peer-media-state", {
        socketId: socket.id,
        audioEnabled,
        videoEnabled,
      });
    });

    // ── DISCONNECT ─────────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`🔴 Socket disconnected: ${socket.id} (${reason})`);

      const room = socket.roomName;
      if (!room || !activeRooms.has(room)) return;

      const roomMap = activeRooms.get(room);
      roomMap.delete(socket.id);

      if (roomMap.size === 0) {
        activeRooms.delete(room);
        console.log(`🗑️ Room deleted: ${room}`);
      } else {
        // Notify the remaining participant
        const users = [...roomMap.values()];
        io.to(room).emit("room-users", { roomName: room, users });
        io.to(room).emit("peer-left", {
          socketId: socket.id,
          name: socket.userName,
          role: socket.userRole,
        });
      }
    });
  });

  return io;
};

export const getIO = () => io;
