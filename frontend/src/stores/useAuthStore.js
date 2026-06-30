import { create } from 'zustand';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';

export const useAuthStore = create((set, get) => ({
  allCounsellors: [],
  user: null,
  isCheckingAuth: true,   // true on initial load until getMe resolves
  isSigningUp: false,
  isLoggingIn: false,
  isAddingCounsellor: false,

  // ─── Auth ───────────────────────────────────────────────────────────────────

  signup: async (formData) => {
    set({ isSigningUp: true });
    try {
      const response = await axios.post('/auth/signup', formData);
      const { user } = response.data;
      set({ user, isSigningUp: false });
      toast.success('Account created successfully!');
      return user; // return so Auth.jsx can react to success
    } catch (error) {
      set({ isSigningUp: false });
      toast.error(error.response?.data?.message || 'Registration failed');
      return null;
    }
  },

  login: async (formData) => {
    set({ isLoggingIn: true });
    try {
      const response = await axios.post('/auth/login', formData);
      const { user } = response.data;
      set({ user, isLoggingIn: false });
      toast.success('Login successful!');
      return user; // return so Auth.jsx can react to success
    } catch (error) {
      set({ isLoggingIn: false });
      toast.error(error.response?.data?.message || 'Login failed');
      return null;
    }
  },

  logout: async () => {
    try {
      await axios.post('/auth/logout');
      set({ user: null, allCounsellors: [] });
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Logout failed');
    }
  },

  getMe: async () => {
    set({ isCheckingAuth: true });
    try {
      const response = await axios.get('/auth/getme');
      set({ user: response.data.user, isCheckingAuth: false });
    } catch {
      // Not logged in — clear user state quietly
      set({ user: null, isCheckingAuth: false });
    }
  },

  editProfile: async (formData) => {
    try {
      const response = await axios.put('/auth/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { user } = response.data;
      set({ user });
      toast.success('Profile updated successfully!');
      return user;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profile update failed');
      return null;
    }
  },

  // ─── Counsellor Management ──────────────────────────────────────────────────

  addCounsellor: async (formData) => {
    set({ isAddingCounsellor: true });
    try {
      await axios.post('/auth/addcounsellor', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Counsellor added successfully!');
      // Refresh the list immediately so UI stays in sync
      await get().getAllCounsellors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add counsellor');
    } finally {
      set({ isAddingCounsellor: false });
    }
  },

  getAllCounsellors: async () => {
    try {
      const response = await axios.get('/auth/getallcounsellors');
      // Backend returns { counsellors: [...] }
      set({ allCounsellors: response.data.counsellors || [] });
    } catch (error) {
      console.error('Failed to fetch counsellors:', error.message);
      set({ allCounsellors: [] });
    }
  },

  deleteCounsellor: async (_id) => {
    try {
      await axios.delete(`/auth/deletecounsellor/${_id}`);
      // Optimistically update the list without another API call
      set((state) => ({
        allCounsellors: state.allCounsellors.filter((c) => c._id !== _id),
      }));
      toast.success('Counsellor deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete counsellor');
    }
  },
}));