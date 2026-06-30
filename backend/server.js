import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import connectDB from './utils/db.js';

import userRoutes from './routes/user.route.js';
import sessionRoutes from './routes/session.route.js';
import feedbackRoutes from './routes/feedback.route.js';

// Load env variables first
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// const app = express();
const PORT = process.env.PORT || 5001;






//  Implementing my WebRTC Socket
import http from "http";
import { initializeSocket } from "./socket/socket.js";
const app = express();
const server = http.createServer(app);
initializeSocket(server);
// Till here









// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// CORS: allow the React dev server and production URL
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', userRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/feedback', feedbackRoutes);

// ─── Production Static Files ──────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Production mode — serving static frontend');
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}

// ─── Start Server ─────────────────────────────────────────────────────────────
// app.listen(PORT, async () => {
//   await connectDB();
//   console.log(`✅ Server running at http://localhost:${PORT}`);
// });





// this is for my WebRTC socket server
server.listen(PORT, async () => {
    await connectDB();
    console.log(`✅ Server running at http://localhost:${PORT}`);
});