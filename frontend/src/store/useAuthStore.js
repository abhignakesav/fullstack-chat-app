import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// Use a separate environment variable for the Socket.IO URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  notifications: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
      get().getNotifications();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(SOCKET_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("newNotification", (notification) => {
      toast.success(notification.content);
      set((state) => ({ notifications: [notification, ...state.notifications] }));
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },

  getNotifications: async () => {
    try {
      const res = await axiosInstance.get("/notifications");
      set({ notifications: res.data });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications.");
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      await axiosInstance.put(`/notifications/${notificationId}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        ),
      }));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read.");
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      const { notifications } = get();
      const unreadNotifications = notifications.filter((n) => !n.read);

      if (unreadNotifications.length > 0) {
        // You might want a batch API endpoint for this if performance is an issue
        // For now, we'll call markNotificationAsRead for each unread notification
        await Promise.all(
          unreadNotifications.map(async (n) => {
            await get().markNotificationAsRead(n._id);
          })
        );
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read.");
    }
  },
}));
