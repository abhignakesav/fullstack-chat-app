import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const receiverId = req.user._id;

    const notifications = await Notification.find({ receiverId })
      .sort({ createdAt: -1 })
      .populate("senderId", "fullName profilePic") // Populate sender details
      .select("-updatedAt");

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error in getNotifications: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id: notificationId } = req.params;
    const receiverId = req.user._id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Ensure the notification belongs to the logged-in user
    if (notification.receiverId.toString() !== receiverId.toString()) {
      return res.status(401).json({ error: "You can only mark your own notifications as read" });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error in markNotificationAsRead: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}; 