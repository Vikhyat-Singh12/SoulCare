import { create } from 'zustand';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';

export const useSessionStore = create((set, get) => ({
  // Student
  upcomingSessions: [],
  previousSessions: [],
  // Counsellor
  counsellorSessions: [],
  // Admin
  allSessions: [],
  groupedSessions: [],
  // Slot availability
  availableSlots: [],
  // Loading states
  isBooking: false,
  isLoading: false,
  isFetchingSlots: false,

  /**
   * Fetch available slots for a given counsellor on a given date.
   */
  getAvailableSlots: async (c_id, date) => {
    set({ isFetchingSlots: true, availableSlots: [] });
    try {
      const response = await axios.get('/session/available-slots', {
        params: { c_id, date },
      });
      set({ availableSlots: response.data.availableSlots || [], isFetchingSlots: false });
    } catch (error) {
      console.error('Failed to fetch available slots:', error.message);
      set({ availableSlots: [], isFetchingSlots: false });
      toast.error(error.response?.data?.message || 'Failed to fetch available slots');
    }
  },

  /**
   * Student books a new session (no topic/short_note required).
   */
  bookSession: async (sessionData) => {
    set({ isBooking: true });
    try {
      const response = await axios.post('/session/create-room', sessionData);
      const { session } = response.data;

      // Prepend to upcoming list immediately
      set((state) => ({
        upcomingSessions: [session, ...state.upcomingSessions],
        isBooking: false,
      }));

      toast.success('Session booked successfully!');
      return session;
    } catch (error) {
      set({ isBooking: false });
      toast.error(error.response?.data?.message || 'Failed to book session');
      return null;
    }
  },

  /**
   * Student cancels their own upcoming session.
   * Moves the session from upcomingSessions to previousSessions.
   */
  cancelSession: async (sessionId) => {
    try {
      const response = await axios.delete(`/session/${sessionId}`);
      const cancelled = response.data.session;

      set((state) => ({
        // Remove from upcoming
        upcomingSessions: state.upcomingSessions.filter((s) => s._id !== sessionId),
        // Add to top of previous (most-recent first)
        previousSessions: [cancelled, ...state.previousSessions],
      }));

      toast.success('Session cancelled successfully');
      return cancelled;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel session');
      return null;
    }
  },

  /**
   * Student fetches their sessions — backend returns two categorized, sorted arrays.
   */
  getStudentSessions: async (anonymous_id) => {
    set({ isLoading: true });
    try {
      const params = anonymous_id ? { anonymous_id } : {};
      const response = await axios.get('/session/student', { params });
      set({
        upcomingSessions: response.data.upcomingSessions || [],
        previousSessions: response.data.previousSessions || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch student sessions:', error.message);
      set({ upcomingSessions: [], previousSessions: [], isLoading: false });
    }
  },

  /**
   * Counsellor fetches their appointments (anonymous data only).
   */
  getCounsellorSessions: async (c_id) => {
    set({ isLoading: true });
    try {
      const params = c_id ? { c_id } : {};
      const response = await axios.get('/session/counsellor', { params });
      set({ counsellorSessions: response.data.sessions || [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch counsellor sessions:', error.message);
      set({ counsellorSessions: [], isLoading: false });
    }
  },

  /**
   * Admin fetches all sessions with full student details, grouped by counsellor.
   */
  getAllSessions: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get('/session/all');
      set({
        allSessions: response.data.sessions || [],
        groupedSessions: response.data.grouped || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch all sessions:', error.message);
      set({ allSessions: [], groupedSessions: [], isLoading: false });
    }
  },

  /**
   * Update a session's status (counsellor or admin).
   */
  updateSessionStatus: async (sessionId, status) => {
    try {
      const response = await axios.patch(`/session/${sessionId}/status`, { status });
      const updated = response.data.session;

      set((state) => ({
        counsellorSessions: state.counsellorSessions.map((s) =>
          s._id === sessionId ? updated : s
        ),
        upcomingSessions: state.upcomingSessions.map((s) =>
          s._id === sessionId ? updated : s
        ),
      }));

      toast.success('Session status updated');
      return updated;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update session status');
      return null;
    }
  },

  /**
   * Counsellor submits feedback/report for a completed session.
   */
  submitFeedback: async (sessionId, feedback) => {
    try {
      const response = await axios.patch(`/session/${sessionId}/feedback`, { feedback });
      const { counsellor_feedback, feedback_submitted_at } = response.data;

      // Update the session in-place in counsellorSessions
      set((state) => ({
        counsellorSessions: state.counsellorSessions.map((s) =>
          s._id === sessionId
            ? { ...s, counsellor_feedback, feedback_submitted_at }
            : s
        ),
      }));

      toast.success('Feedback submitted successfully!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
      return false;
    }
  },
}));

