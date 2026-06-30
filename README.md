# SoulCare 💙

SoulCare is a comprehensive mental health and counselling platform built on the MERN stack. It connects students with professional counsellors through a seamless, secure, and intuitive web application, featuring live video/audio/text sessions, an advanced appointment booking system, and clinical assessment tools.

---

## ✨ Features

### 👤 Role-Based Access
- **Students**: Can book appointments, manage their profile, view past session reports, and join live sessions (Video, Audio, or Text).
- **Counsellors**: Have a dedicated dashboard to view upcoming, ongoing, and completed sessions. They can write clinical assessment reports, evaluate risk/mood, and schedule follow-ups.
- **Admins**: Can manage counsellors, view platform-wide analytics, and access all session feedback reports.

### 📅 Advanced Appointment Booking
- Real-time slot availability checking.
- Automated conflict prevention (no double-booking for counsellors).
- Follow-up session booking directly from the post-session report.

### 🎥 Live WebRTC Sessions
- **Multi-modal**: Choose between Video Call, Voice Call, or Text Chat.
- **Robust Connection**: Powered by Socket.io for signalling and WebRTC for peer-to-peer media. Includes Twilio TURN server integration for NAT traversal to guarantee connections even on strict networks.
- **In-Session Tools**: Screen sharing, toggle mic/camera, live chat sidebar, call duration timer, and connection quality indicators.
- **Privacy First**: Built-in logic ensures only the specific booked student and counsellor can enter their room.

### 📝 Clinical Assessments & Feedback
- Counsellors can submit detailed post-session reports.
- Includes Mood Rating (1-5 with emojis), Risk Level assessment (Low/Moderate/High), and dynamic point-wise observations and recommendations.
- Reports are securely accessible by the student and the admin.

### 🎨 Modern UI/UX
- Fully responsive design built with React, Tailwind CSS, and Lucide Icons.
- Glassmorphism, smooth animations, and role-specific dynamic dashboards.

---

## 🛠️ Tech Stack

**Frontend:**
- React.js (Vite)
- Tailwind CSS
- Zustand (State Management)
- React Router DOM
- Socket.io-client
- WebRTC (Native Browser API)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- Socket.io (Signalling server)
- JWT (JSON Web Tokens for Auth)
- Twilio (STUN/TURN servers)

---

## 🚀 Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/Vikhyat-Singh12/SoulCare.git
cd SoulCare
```

### 2. Install Dependencies
This project uses a monorepo setup. You can install all dependencies from the root directory:
```bash
npm run build
```
*(This command runs `npm install` for the root/backend and `npm install --prefix frontend` for the frontend).*

### 3. Environment Variables
Create a `.env` file in the **root** directory and add the following:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# For WebRTC TURN Servers (Metered OpenRelay is used by default, no account needed)
TURN_URL=turn:openrelay.metered.ca:80
TURN_USERNAME=openrelayproject
TURN_CREDENTIAL=openrelayproject
```

### 4. Run the Application
Run the backend and frontend concurrently (requires opening two terminal tabs or using a tool like concurrently):

**Terminal 1 (Backend):**
```bash
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
The app will be running at `http://localhost:5173`.

---

## 🌍 Deployment

SoulCare is configured to be deployed as a **Single Web Service** (e.g., on Render, Heroku, or DigitalOcean). 

1. **Build Step**: The root `package.json` includes a `build` script that compiles the Vite frontend.
2. **Static Serving**: In production (`NODE_ENV=production`), the Express backend automatically serves the compiled static files from `frontend/dist`.
3. **Commands for Render**:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

---

## 🔒 Security & Privacy
- **Protected Routes**: React Router guards prevent unauthorized access to role-specific dashboards.
- **Secure Endpoints**: All API routes are protected by robust JWT middleware verifying user roles.
