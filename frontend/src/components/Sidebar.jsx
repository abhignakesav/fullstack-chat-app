import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, PlusCircle, Group as GroupIcon } from "lucide-react";
import { formatMessageTime } from "../lib/utils";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const Sidebar = () => {
  const { getUsers, users, getGroups, groups, selectedChat, setSelectedChat, isUsersLoading, isGroupsLoading } = useChatStore();

  const { authUser, onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  // Sort users by last message timestamp (most recent first)
  const sortedUsers = [...users].sort((a, b) => {
    if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
    if (!a.lastMessageTimestamp) return 1;
    if (!b.lastMessageTimestamp) return -1;
    return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
  });

  const sortedGroups = [...groups].sort((a, b) => {
    if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
    if (!a.lastMessageTimestamp) return 1;
    if (!b.lastMessageTimestamp) return -1;
    return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
  });

  const filteredUsers = showOnlineOnly
    ? sortedUsers.filter((user) => onlineUsers.includes(user._id))
    : sortedUsers;

  if (isUsersLoading || isGroupsLoading) return <SidebarSkeleton />;

  const handleCreateGroup = async () => {
    if (!groupName) {
      return toast.error("Please enter a group name.");
    }
    if (selectedMembers.length < 2) {
      return toast.error("Please select at least two members for the group.");
    }

    setIsCreatingGroup(true);
    try {
      const res = await axiosInstance.post("/groups/create", { name: groupName, members: selectedMembers });
      console.log("Group created:", res.data);
      toast.success("Group created successfully!");
      setGroupName("");
      setSelectedMembers([]);
      setShowCreateGroup(false);
      getGroups(); // Refresh groups list after creation
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error(error.response?.data?.error || "Failed to create group.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length} online)</span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <button 
            className="flex items-center gap-2 text-sm w-full btn btn-sm btn-ghost"
            onClick={() => setShowCreateGroup(!showCreateGroup)}
          >
            <PlusCircle className="size-4" />
            <span>{showCreateGroup ? "Cancel Group" : "Create Group"}</span>
          </button>
        </div>
      </div>

      <div className="overflow-y-auto w-full">
        {showCreateGroup ? (
          <div className="p-4">
            <h2 className="font-semibold mb-3">Create New Group</h2>
            <input
              type="text"
              placeholder="Group Name"
              className="input input-bordered w-full mb-3"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto border rounded-md p-2">
              {/* User selection for group members */}
              {sortedUsers.map((user) => (
                <div key={user._id} className="flex items-center gap-2 py-1">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-sm" 
                    checked={selectedMembers.includes(user._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers([...selectedMembers, user._id]);
                      } else {
                        setSelectedMembers(selectedMembers.filter((id) => id !== user._id));
                      }
                    }}
                  />
                  <span>{user.fullName}</span>
                </div>
              ))}
            </div>
            <button 
              className="btn btn-primary btn-sm w-full mt-3"
              onClick={handleCreateGroup}
              disabled={isCreatingGroup}
            >
              {isCreatingGroup ? "Creating..." : "Create Group"}
            </button>
          </div>
        ) : (
          <>
            {/* Render Users */}
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => setSelectedChat(user, "user")}
                className={`
                  w-full flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  ${selectedChat?._id === user._id && selectedChat.type === "user" ? "bg-base-300 ring-1 ring-base-300" : ""}
                  py-2 px-3
                  ${user.lastMessage && !user.lastMessage.read && user.lastMessage.receiverId === authUser._id ? "bg-primary/10" : ""} 
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="size-12 object-cover rounded-full"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                      rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                </div>

                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate flex justify-between items-center">
                    <span>{user.fullName}</span>
                    {user.lastMessageTimestamp && (
                      <span className="text-xs opacity-50">
                        {formatMessageTime(user.lastMessageTimestamp)}
                      </span>
                    )}
                  </div>
                  {user.lastMessage && (
                    <div className={`text-sm truncate ${!user.lastMessage.read && user.lastMessage.receiverId === authUser._id ? "font-semibold text-primary" : "text-zinc-400"}`}>
                      {user.lastMessage.text ? user.lastMessage.text : user.lastMessage.image ? "Image" : ""}
                    </div>
                  )}
                </div>
              </button>
            ))}

            {/* Render Groups */}
            {sortedGroups.map((group) => (
              <button
                key={group._id}
                onClick={() => setSelectedChat(group, "group")}
                className={`
                  w-full flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  ${selectedChat?._id === group._id && selectedChat.type === "group" ? "bg-base-300 ring-1 ring-base-300" : ""}
                  py-2 px-3
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <GroupIcon className="size-12 object-cover rounded-full p-2 bg-base-200 text-base-content" />
                </div>

                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate flex justify-between items-center">
                    <span>{group.name}</span>
                    {group.lastMessageTimestamp && (
                      <span className="text-xs opacity-50">
                        {formatMessageTime(group.lastMessageTimestamp)}
                      </span>
                    )}
                  </div>
                  {/* Group last message display can be added here if you extend your Message model to include group IDs */}
                  <div className="text-sm truncate text-zinc-400">
                    Group Chat
                  </div>
                </div>
              </button>
            ))}

            {(filteredUsers.length === 0 && sortedGroups.length === 0) && (
              <div className="text-center text-zinc-500 py-4">No chats found</div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
