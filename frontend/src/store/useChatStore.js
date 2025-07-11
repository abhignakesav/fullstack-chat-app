import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

const initialState = {
  messages: [],
  users: [],
  groups: [],
  selectedChat: null,
  selectedChatType: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isGroupsLoading: false,
  searchResults: {
    users: [],
    groups: []
  },
  isSearching: false
};

export const useChatStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      getUsers: async () => {
        set({ isUsersLoading: true });
        try {
          const res = await axiosInstance.get("/messages/users");
          console.log("Users response:", res.data);
          
          if (res?.data) {
            // Ensure each user has required fields and a default profilePic
            const processedUsers = res.data.map(user => {
              let profilePic = user.profilePic;
              if (!profilePic || typeof profilePic !== 'string') {
                console.warn("User missing profilePic or invalid type, setting default:", user);
                profilePic = "/avatar.png";
              }
              // Also ensure fullName is a string, although already checked in filter, for consistency
              const fullName = (user.fullName && typeof user.fullName === 'string') ? user.fullName : "Unknown User";

              return { ...user, profilePic, fullName };
            });

            const validUsers = processedUsers.filter(user => 
              user && 
              user._id && 
              typeof user._id === 'string'
              // fullName and profilePic are now guaranteed to be strings
            );
            console.log("Valid users after processing:", validUsers);
            set({ users: validUsers });
          } else {
            console.log("No users data in response");
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
          
          console.log("Messages response:", res?.data);
          
          if (res?.data) {
            // Ensure each message has required fields
            const validMessages = res.data.filter(message => 
              message && 
              message._id && 
              message.senderId && 
              message.createdAt &&
              typeof message.senderId === 'string'
            );
            console.log("Valid messages:", validMessages);
            set({ messages: validMessages });
          } else {
            console.log("No messages data in response");
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

      setSelectedChat: (chat, chatType) => {
        console.log("Setting selected chat:", chat, chatType);
        if (!chat || !chatType) {
          console.log("Invalid chat or chat type provided to setSelectedChat.");
          set({ selectedChat: null, selectedChatType: null, messages: [] });
          return;
        }

        // Ensure profilePic exists for user chats, or set a default
        const chatWithProfilePic = { ...chat };
        if (chatType === "user") {
          if (!chatWithProfilePic.profilePic) {
            console.log("selected user chat missing profilePic, setting default.", chatWithProfilePic);
            chatWithProfilePic.profilePic = "/avatar.png";
          }
        } else if (chatType === "group") {
          // For group chats, ensure 'name' is present, and set a default 'profilePic' concept if needed
          if (!chatWithProfilePic.name) {
            console.warn("Group chat missing name property:", chatWithProfilePic);
            chatWithProfilePic.name = "Unknown Group";
          }
          // You might want a specific default group icon here if not already handled in ChatHeader/ChatContainer
          // chatWithProfilePic.profilePic = "/group-avatar.png"; // Example if you have a group-specific default
        }

        set({ selectedChat: chatWithProfilePic, selectedChatType: chatType, messages: [] });
        console.log("Selected chat updated to:", chatWithProfilePic, chatType);
      },

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
            await axiosInstance.delete(`/groups/${chatId}`);
          }
          
          set((state) => ({
            messages: [],
            selectedChat: null,
            selectedChatType: null,
            groups: state.groups.filter(group => group._id !== chatId),
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

      searchUsers: async (query) => {
        if (!query.trim()) {
          set({ searchResults: { users: [], groups: [] } });
          return;
        }

        set({ isSearching: true });
        try {
          const res = await axiosInstance.get(`/users/search?query=${encodeURIComponent(query)}`);
          console.log("Search results:", res.data);
          set((state) => ({
            searchResults: {
              ...state.searchResults,
              users: res.data.users
            }
          }));
        } catch (error) {
          console.error("Error searching users:", error);
          toast.error(error.response?.data?.message || "Failed to search users");
        } finally {
          set({ isSearching: false });
        }
      },

      searchGroups: async (query) => {
        if (!query.trim()) {
          set({ searchResults: { users: [], groups: [] } });
          return;
        }

        set({ isSearching: true });
        try {
          const res = await axiosInstance.get(`/users/search/groups?query=${encodeURIComponent(query)}`);
          console.log("Group search results:", res.data);
          set((state) => ({
            searchResults: {
              ...state.searchResults,
              groups: res.data.groups
            }
          }));
        } catch (error) {
          console.error("Error searching groups:", error);
          toast.error(error.response?.data?.message || "Failed to search groups");
        } finally {
          set({ isSearching: false });
        }
      },

      clearSearchResults: () => {
        set({ searchResults: { users: [], groups: [] } });
      },
    }),
    { name: "chat-store" }
  )
);
