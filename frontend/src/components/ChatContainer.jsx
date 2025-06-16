import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { MoreVertical, Trash2, AlertTriangle, Users as GroupIcon } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Volume2 } from "lucide-react";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedChat,
    selectedChatType,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    deleteChat,
    markMessagesAsRead,
    users
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState(null);

  useEffect(() => {
    console.log("selectedChat changed:", selectedChat);
    console.log("selectedChatType changed:", selectedChatType);

    if (selectedChat) {
      getMessages(selectedChat._id, selectedChatType);
      subscribeToMessages();
      if (selectedChatType === "user") {
        markMessagesAsRead(selectedChat._id, selectedChatType);
      }
    }
    return () => {
      unsubscribeFromMessages();
      useChatStore.setState({ messages: [] });
    };
  }, [selectedChat, selectedChatType, getMessages, subscribeToMessages, unsubscribeFromMessages, markMessagesAsRead]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSpeak = (text) => {
    if (!('speechSynthesis' in window)) {
      toast.error("Text-to-speech is not supported by your browser.");
      return;
    }
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  const handleDelete = async (type) => {
    setDeleteType(type);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === 'chat' && selectedChat) {
        await deleteChat(selectedChat._id, selectedChatType);
      } else if (deleteType === 'message') {
        // This will be handled by the deleteMessage function directly
      }
    } catch (error) {
      console.error('Error deleting chat/message:', error);
    }
    setShowDeleteConfirm(false);
    setDeleteType(null);
  };

  if (isMessagesLoading || !selectedChat) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        {!selectedChat ? (
          <div className="flex-1 flex items-center justify-center text-base-content/70">No chat selected.</div>
        ) : (
          <MessageSkeleton />
        )}
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                {selectedChatType === "user" ? (
                  <img src={selectedChat.profilePic || "/avatar.png"} alt={selectedChat.fullName} />
                ) : (
                  <div className="size-10 rounded-full bg-base-200 flex items-center justify-center">
                    <GroupIcon className="size-6 text-base-content" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium">{selectedChatType === "user" ? selectedChat.fullName : selectedChat.name}</h3>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-base-100 rounded-lg shadow-lg border border-base-300 z-10">
                <button
                  onClick={() => handleDelete('chat')}
                  className="w-full px-4 py-2 text-left hover:bg-base-200 text-error flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages && messages.length > 0 ? (
          messages.map((message) => {
            if (!message || !message.senderId) return null;
            
            const isMine = message.senderId === authUser?._id;
            const senderUser = users?.find(u => u?._id === message.senderId);
            const displayUser = senderUser || authUser;
            
            if (!displayUser || !displayUser._id) return null;
            
            const profilePic = isMine 
              ? (authUser?.profilePic || "/avatar.png")
              : (displayUser?.profilePic || "/avatar.png");
            
            return (
              <div
                key={message._id}
                className={`chat ${isMine ? "chat-end" : "chat-start"}`}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={profilePic}
                      alt="profile pic"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/avatar.png";
                      }}
                    />
                  </div>
                </div>
                <div className="chat-header mb-1">
                  {selectedChatType === "group" && !isMine && (
                    <span className="text-xs opacity-70 mr-2">
                      {displayUser?.fullName || "Unknown User"}
                    </span>
                  )}
                  <time className="text-xs opacity-50 ml-1">
                    {message.createdAt ? formatMessageTime(message.createdAt) : ""}
                  </time>
                </div>
                <div 
                  className={`chat-bubble flex flex-col group relative ${
                    !isMine && !message.read && selectedChatType === "user" ? "bg-primary/20" : ""
                  }`}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  )}
                  {message.text && (
                    <p className="flex items-center gap-2">
                      <span>{message.text}</span>
                      <button
                        onClick={() => handleSpeak(message.text)}
                        className="btn btn-ghost btn-xs btn-circle opacity-70 hover:opacity-100"
                        title="Listen to message"
                      >
                        <Volume2 size={16} />
                      </button>
                    </p>
                  )}
                  {isMine && (
                    <button
                      onClick={() => deleteMessage(message._id)}
                      className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete message"
                    >
                      <Trash2 size={16} className="text-error" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center text-base-content/70">No messages found.</div>
        )}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-error" />
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            </div>
            <p className="mb-6">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn btn-error"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
