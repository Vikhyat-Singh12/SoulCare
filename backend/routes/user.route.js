import express from 'express';
import upload from '../utils/upload.js';
import {
  addCounsellor,
  getMe,
  login,
  logout,
  signup,
  editProfile,
  getAllCounsellors,
  deleteCounsellor,
} from '../controller/user.controller.js';
import {
  adminMiddleware,
  commonMiddleware,
  studentMiddleware,
} from '../middlewares/user.middleware.js';

const router = express.Router();

// ─── Public Routes ───────────────────────────────────────────────────────────
router.post('/signup', signup);
router.post('/login', login);

// ─── Authenticated Routes (any role) ─────────────────────────────────────────
router.post('/logout', commonMiddleware, logout);
router.get('/getme', commonMiddleware, getMe);
router.get('/getallcounsellors', commonMiddleware, getAllCounsellors);

// ─── Student Routes ───────────────────────────────────────────────────────────
// Multer runs AFTER auth check — avoids wasted uploads from unauthenticated requests
router.put('/update', studentMiddleware, upload.single('image'), editProfile);

// ─── Admin-Only Routes ────────────────────────────────────────────────────────
// Auth middleware runs FIRST so unauthenticated users can't trigger Cloudinary uploads
router.post('/addcounsellor', adminMiddleware, upload.single('image'), addCounsellor);
// Use route param so DELETE body isn't needed (unreliable in some clients)
router.delete('/deletecounsellor/:id', adminMiddleware, deleteCounsellor);

export default router;