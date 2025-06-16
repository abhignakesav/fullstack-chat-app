import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { Users as GroupIcon } from "lucide-react";

const ChatHeader = () => {
  const { selectedChat, selectedChatType, setSelectedChat } = useChatStore();
  const { onlineUsers } = useAuthStore();

  if (!selectedChat) {
    return null;
  }

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              {selectedChatType === "user" ? (
                <img 
                  src={selectedChat.profilePic || "/avatar.png"} 
                  alt={selectedChat.fullName || "User"} 
                  onError={(e) => { e.target.onerror = null; e.target.src="/avatar.png"; }}
                />
              ) : (
                <div className="size-10 rounded-full bg-base-200 flex items-center justify-center">
                  <GroupIcon className="size-6 text-base-content" />
                </div>
              )}
            </div>
          </div>

          {/* Chat info (User or Group) */}
          <div>
            <h3 className="font-medium">
              {selectedChatType === "user" ? selectedChat.fullName : selectedChat.name}
            </h3>
            {selectedChatType === "user" && (
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedChat._id) ? "Online" : "Offline"}
              </p>
            )}
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedChat(null, null)}>
          <X />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
