import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  selectedChat: null,
  selectedChatType: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isGroupsLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      if (res?.data) {
        // Ensure each user has required fields
        const validUsers = res.data.filter(user => user && user._id);
        set({ users: validUsers });
      } else {
        set({ users: [] });
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error(error.response?.data?.message || "Failed to load users");
      set({ users: [] });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  getMessages: async (chatId, chatType) => {
    set({ isMessagesLoading: true });
    try {
      // Ensure users are loaded first
      if (chatType === "user") {
        try {
          await get().getUsers();
        } catch (error) {
          console.error("Error loading users:", error);
          // Continue with message loading even if users fail to load
        }
      }
      
      let res;
      if (chatType === "user") {
        res = await axiosInstance.get(`/messages/${chatId}`);
      } else if (chatType === "group") {
        res = await axiosInstance.get(`/messages/group/${chatId}`);
      }
      
      if (res?.data) {
        // Ensure each message has required fields
        const validMessages = res.data.filter(message => 
          message && 
          message._id && 
          message.senderId && 
          message.createdAt
        );
        set({ messages: validMessages });
      } else {
        set({ messages: [] });
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error(error.response?.data?.message || "Failed to load messages");
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedChat, selectedChatType, messages } = get();
    if (!selectedChat || !selectedChatType) return;

    try {
      let res;
      if (selectedChatType === "user") {
        res = await axiosInstance.post(`/messages/send/${selectedChat._id}`, messageData);
      } else if (selectedChatType === "group") {
        res = await axiosInstance.post(`/messages/group/${selectedChat._id}/send`, messageData);
      }
      set({ messages: [...messages, res.data] });

      // Update users/groups list order in real-time after sending a message
      set((state) => {
        if (selectedChatType === "user") {
          const otherUserId = selectedChat._id; // The receiver of the sent message
          const updatedUsers = state.users.map((user) =>
            user._id === otherUserId
              ? { ...user, lastMessageTimestamp: new Date(res.data.createdAt) }
              : user
          );

          updatedUsers.sort((a, b) => {
            if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
            if (!a.lastMessageTimestamp) return 1;
            if (!b.lastMessageTimestamp) return -1;
            return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
          });
          return { users: updatedUsers };
        } else if (selectedChatType === "group") {
          const updatedGroups = state.groups.map((group) =>
            group._id === selectedChat._id
              ? { ...group, lastMessageTimestamp: new Date(res.data.createdAt) }
              : group
          );
          updatedGroups.sort((a, b) => {
            if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
            if (!a.lastMessageTimestamp) return 1;
            if (!b.lastMessageTimestamp) return -1;
            return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
          });
          return { groups: updatedGroups };
        }
        return state;
      });

    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedChat, selectedChatType } = get();
    const { authUser } = useAuthStore.getState();

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageFromSelectedChat = selectedChat && (
        (selectedChatType === "user" && 
          (newMessage.senderId === selectedChat._id || newMessage.receiverId === selectedChat._id))
        ||
        (selectedChatType === "group" && newMessage.group === selectedChat._id)
      );

      if (isMessageFromSelectedChat) {
        set({
          messages: [...get().messages, newMessage],
        });
      }

      // Update users list order in real-time
      set((state) => {
        let updatedUsers = [...state.users];
        let updatedGroups = [...state.groups];

        if (newMessage.receiverId) { // Individual message
          const otherUserId = newMessage.senderId === authUser._id ? newMessage.receiverId : newMessage.senderId;
          updatedUsers = state.users.map((user) =>
            user._id === otherUserId
              ? { ...user, lastMessageTimestamp: new Date(newMessage.createdAt) }
              : user
          );
          updatedUsers.sort((a, b) => {
            if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
            if (!a.lastMessageTimestamp) return 1;
            if (!b.lastMessageTimestamp) return -1;
            return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
          });
        } else if (newMessage.group) { // Group message
          updatedGroups = state.groups.map((group) =>
            group._id === newMessage.group
              ? { ...group, lastMessageTimestamp: new Date(newMessage.createdAt) }
              : group
          );
          updatedGroups.sort((a, b) => {
            if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
            if (!a.lastMessageTimestamp) return 1;
            if (!b.lastMessageTimestamp) return -1;
            return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
          });
        }

        return { users: updatedUsers, groups: updatedGroups };
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedChat: (chat, chatType) => set({ selectedChat: chat, selectedChatType: chatType, messages: [] }),

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

  deleteChat: async (chatId, chatType) => {
    try {
      if (chatType === "user") {
        await axiosInstance.delete(`/messages/chat/${chatId}`);
      } else if (chatType === "group") {
        // await axiosInstance.delete(`/groups/${chatId}/delete`); // To be implemented later if needed
        toast.error("Group chat deletion is not yet supported.");
        return;
      }
      
      set((state) => ({
        messages: [],
        selectedChat: null,
        selectedChatType: null,
      }));
      toast.success("Chat deleted successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  markMessagesAsRead: async (chatId, chatType) => {
    try {
      if (chatType === "user") {
        await axiosInstance.put(`/messages/${chatId}/read`);
      } else if (chatType === "group") {
        // Logic for marking group messages as read if applicable
        console.warn("Marking group messages as read is not yet implemented.");
      }
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.senderId === chatId ? { ...msg, read: true } : msg
        ),
      }));
    } catch (error) {
      console.error("Error marking messages as read:", error);
      toast.error("Failed to mark messages as read");
    }
  },
}));
