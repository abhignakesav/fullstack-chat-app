import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { Users as GroupIcon, User2 } from "lucide-react";
import { useState } from "react";

const ChatHeader = () => {
  const { selectedChat, selectedChatType, setSelectedChat, users } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);

  if (!selectedChat) {
    return null;
  }

  // Debugging logs for group members functionality
  console.log("ChatHeader: selectedChat", selectedChat);
  console.log("ChatHeader: selectedChatType", selectedChatType);

  const groupMembersDetails = selectedChatType === "group" && selectedChat.members ?
    selectedChat.members.map(memberId => users.find(user => user._id === memberId))
      .filter(Boolean) // Filter out any undefined members
    : [];
  console.log("ChatHeader: groupMembersDetails", groupMembersDetails);

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
                <div 
                  className="size-10 rounded-full bg-base-200 flex items-center justify-center cursor-pointer"
                  onClick={() => setShowGroupMembersModal(true)}
                >
                  <GroupIcon className="size-6 text-base-content" />
                </div>
              )}
            </div>
          </div>

          {/* Chat info (User or Group) */}
          <div
            className={`${selectedChatType === "group" ? "cursor-pointer" : ""}`}
            onClick={selectedChatType === "group" ? () => setShowGroupMembersModal(true) : null}
          >
            <h3 className="font-medium">
              {selectedChatType === "user" ? selectedChat.fullName : selectedChat.name}
            </h3>
            {selectedChatType === "user" && (
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedChat._id) ? "Online" : "Offline"}
              </p>
            )}
            {selectedChatType === "group" && (
              <p className="text-sm text-base-content/70">
                {groupMembersDetails.length} members
              </p>
            )}
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedChat(null, null)}>
          <X />
        </button>
      </div>

      {/* Group Members Modal */}
      {showGroupMembersModal && selectedChatType === "group" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Group Members ({groupMembersDetails.length})</h3>
              <button 
                onClick={() => setShowGroupMembersModal(false)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {groupMembersDetails.length > 0 ? (
                groupMembersDetails.map(member => (
                  <div key={member._id} className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="size-8 rounded-full">
                        <img 
                          src={member.profilePic || "/avatar.png"} 
                          alt={member.fullName || "User"} 
                          onError={(e) => { e.target.onerror = null; e.target.src="/avatar.png"; }}
                        />
                      </div>
                    </div>
                    <span>{member.fullName}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-base-content/70">No members found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatHeader;
