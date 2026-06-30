import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useFeedbackStore = create((set) => ({
  studentFeedback:    [],
  counsellorFeedback: [],
  allFeedback:        [],
  currentFeedback:    null,
  isSubmitting:       false,
  isLoading:          false,

  /** Counsellor submits a full point-wise feedback report */
  submitFeedback: async (feedbackData) => {
    set({ isSubmitting: true });
    try {
      const response = await axios.post("/feedback/create", feedbackData);
      const { feedback } = response.data;
      set((state) => ({
        counsellorFeedback: [feedback, ...state.counsellorFeedback],
        isSubmitting: false,
      }));
      toast.success("Feedback report saved successfully!");
      return feedback;
    } catch (error) {
      set({ isSubmitting: false });
      toast.error(error.response?.data?.message || "Failed to submit feedback");
      return null;
    }
  },

  /** Fetch a single feedback report by its Mongo _id */
  getFeedbackById: async (id) => {
    set({ isLoading: true, currentFeedback: null });
    try {
      const response = await axios.get(`/feedback/${id}`);
      set({ currentFeedback: response.data.feedback, isLoading: false });
      return response.data.feedback;
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.message || "Could not load feedback report");
      return null;
    }
  },

  /** Student views their own feedback reports */
  getStudentFeedback: async (anonymous_id) => {
    set({ isLoading: true });
    try {
      const params = anonymous_id ? { anonymous_id } : {};
      const response = await axios.get("/feedback/student", { params });
      set({ studentFeedback: response.data.feedback || [], isLoading: false });
    } catch (error) {
      console.error("Failed to fetch student feedback:", error.message);
      set({ studentFeedback: [], isLoading: false });
    }
  },

  /** Counsellor views all feedback they submitted */
  getCounsellorFeedback: async (c_id) => {
    set({ isLoading: true });
    try {
      const params = c_id ? { c_id } : {};
      const response = await axios.get("/feedback/counsellor", { params });
      set({ counsellorFeedback: response.data.feedback || [], isLoading: false });
    } catch (error) {
      console.error("Failed to fetch counsellor feedback:", error.message);
      set({ counsellorFeedback: [], isLoading: false });
    }
  },

  /** Admin views all feedback across the platform */
  getAllFeedback: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get("/feedback/all");
      set({ allFeedback: response.data.feedback || [], isLoading: false });
    } catch (error) {
      console.error("Failed to fetch all feedback:", error.message);
      set({ allFeedback: [], isLoading: false });
    }
  },
}));
