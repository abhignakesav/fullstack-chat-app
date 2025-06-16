import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: false, // Message ID is optional, for general notifications
    },
    type: {
      type: String,
      enum: ["new_message", "chat_update", "other"], // Define notification types
      default: "new_message",
    },
    read: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String, // E.g., "You have a new message from [sender]"
      required: true,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification; 