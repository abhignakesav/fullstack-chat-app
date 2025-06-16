import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Send, Bell, Mail, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How\'s it going?", isSent: false },
  { id: 2, content: "I\'m doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { getUsers } = useChatStore();
  const { authUser, notifications, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useAuthStore();

  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (authUser) {
      getNotifications();
    }
  }, [authUser, getNotifications]);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    if (tabName === "notifications") {
      markAllNotificationsAsRead();
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await markNotificationAsRead(notificationId);
  };

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-6">
        <div role="tablist" className="tabs tabs-boxed">
          <a
            role="tab"
            className={`tab ${activeTab === "profile" ? "tab-active" : ""}`}
            onClick={() => handleTabClick("profile")}
          >
            Profile
          </a>
          <a
            role="tab"
            className={`tab ${activeTab === "theme" ? "tab-active" : ""}`}
            onClick={() => handleTabClick("theme")}
          >
            Theme
          </a>
          <a
            role="tab"
            className={`tab ${activeTab === "notifications" ? "tab-active" : ""}`}
            onClick={() => handleTabClick("notifications")}
          >
            Notifications
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="badge badge-primary ml-2">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </a>
        </div>

        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Profile Settings</h2>
              <p className="text-sm text-base-content/70">Manage your profile details and preferences.</p>
            </div>
            <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                <div className="avatar">
                    <div className="size-24 rounded-full relative">
                      <img src={authUser?.profilePic || "/avatar.png"} alt="User Avatar" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold">{authUser?.fullName}</h3>
                    <p className="text-sm text-base-content/70">@{authUser?.username}</p>
                </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Chat Preview</h3>
              <div className="flex flex-col gap-4">
                <div className="chat-bubble-preview-container bg-base-200/50 rounded-xl p-4">
                    <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                      {PREVIEW_MESSAGES.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`
                              max-w-[80%] rounded-xl p-3 shadow-sm
                              ${message.isSent ? "bg-primary text-primary-content" : "bg-base-200"}
                            `}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`
                                text-[10px] mt-1.5
                                ${message.isSent ? "text-primary-content/70" : "text-base-content/70"}
                              `}
                            >
                              12:00 PM
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-base-300 bg-base-100">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input input-bordered flex-1 text-sm h-10"
                          placeholder="Type a message..."
                          value="This is a preview"
                          readOnly
                        />
                        <button className="btn btn-primary h-10 min-h-0">
                          <Send size={18} />
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "theme" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Theme Settings</h2>
              <p className="text-sm text-base-content/70">Customize the look and feel of the app.</p>
            </div>
            <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {THEMES.map((t) => (
                  <div
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className={`rounded-lg p-2 flex flex-col items-center justify-center gap-2 cursor-pointer border-2 ${theme === t.name ? "border-primary" : "border-transparent"} transition-colors`}
                    data-theme={t.name}
                  >
                    <div className="size-12 rounded-full flex items-center justify-center text-lg font-bold shadow-md overflow-hidden ring-1 ring-base-content/10">
                      <div className="w-full h-full flex flex-wrap ">
                        <div className="w-1/2 h-1/2 bg-primary"></div>
                        <div className="w-1/2 h-1/2 bg-secondary"></div>
                        <div className="w-1/2 h-1/2 bg-accent"></div>
                        <div className="w-1/2 h-1/2 bg-neutral"></div>
                      </div>
                    </div>
                    <span className="text-sm capitalize text-base-content/80">{t.name}</span>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <p className="text-sm text-base-content/70">Your recent activities and messages</p>
            </div>
            <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg p-6">
              {notifications.length === 0 ? (
                <p className="text-center text-base-content/70">No notifications yet.</p>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`flex items-start justify-between p-3 rounded-lg ${notification.read ? "bg-base-200" : "bg-primary/10"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="size-10 rounded-full relative">
                            <img src={notification.senderId?.profilePic || "/avatar.png"} alt={notification.senderId?.fullName || "User"} />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-base-content">{notification.content}</p>
                          <p className="text-xs text-base-content/60">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="btn btn-xs btn-outline btn-primary"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default SettingsPage;
