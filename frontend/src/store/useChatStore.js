import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/message/${messageId}`);
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
      toast.success("Message deleted successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  deleteChat: async (userId) => {
    try {
      await axiosInstance.delete(`/messages/chat/${userId}`);
      set((state) => ({
        messages: [],
        selectedUser: null,
      }));
      toast.success("Chat deleted successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  hideChat: async (userId) => {
    try {
      await axiosInstance.post(`/messages/hide/${userId}`);
      set((state) => ({
        selectedUser: null,
      }));
      toast.success("Chat hidden successfully");
      get().getUsers();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  unhideChat: async (userId) => {
    try {
      await axiosInstance.post(`/messages/unhide/${userId}`);
      toast.success("Chat unhidden successfully");
      // Optionally, refresh users or update state to show the unhidden chat
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  getHiddenChats: async () => {
    try {
      const res = await axiosInstance.get("/messages/hidden-chats");
      return res.data;
    } catch (error) {
      toast.error(error.response.data.message);
      return [];
    }
  },
}));
