import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Notification from "../models/notification.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // First, get all users excluding the logged-in user
    const allUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    // Filter out users whose chats are hidden for the loggedInUserId
    const usersFilteredByHidden = await Promise.all(
      allUsers.filter(async (user) => {
        const hiddenMessagesCount = await Message.countDocuments({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
          [`hiddenFor.${loggedInUserId}`]: true,
        });
        return hiddenMessagesCount === 0;
      })
    );

    const usersWithLastMessage = await Promise.all(
      usersFilteredByHidden.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
          [`hiddenFor.${loggedInUserId}`]: { $ne: true }, // Ensure message is not hidden
        }).sort({ createdAt: -1 }); // Get the most recent message

        return {
          ...user.toObject(),
          lastMessageTimestamp: lastMessage ? lastMessage.createdAt : null,
        };
      })
    );

    // Sort users by last message timestamp (most recent first)
    usersWithLastMessage.sort((a, b) => {
      if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
      if (!a.lastMessageTimestamp) return 1;
      if (!b.lastMessageTimestamp) return -1;
      return b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime();
    });

    res.status(200).json(usersWithLastMessage);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      [`hiddenFor.${myId}`]: { $ne: true },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // Create and save a new notification for the receiver
    const newNotification = new Notification({
      senderId: newMessage.senderId,
      receiverId: newMessage.receiverId,
      messageId: newMessage._id,
      type: "new_message",
      content: `You have a new message from ${req.user.fullName || req.user.username}`,
    });
    await newNotification.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      // Emit newMessage to the receiver (for chat update)
      io.to(receiverSocketId).emit("newMessage", newMessage);
      // Emit newNotification to the receiver (for general notification)
      io.to(receiverSocketId).emit("newNotification", newNotification);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Delete all messages between the two users
    await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.log("Error in deleteChat controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const myId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Ensure the user deleting the message is the sender
    if (message.senderId.toString() !== myId.toString()) {
      return res.status(401).json({ error: "You can only delete your own messages" });
    }

    await Message.deleteOne({ _id: messageId });

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const hideChat = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Update all messages to be hidden for the current user
    await Message.updateMany(
      {
        $or: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
      },
      { $set: { [`hiddenFor.${myId}`]: true } }
    );

    res.status(200).json({ message: "Chat hidden successfully" });
  } catch (error) {
    console.log("Error in hideChat controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unhideChat = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Update all messages to be unhidden for the current user
    await Message.updateMany(
      {
        $or: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
      },
      { $unset: { [`hiddenFor.${myId}`]: "" } } // Use $unset to remove the field
    );

    res.status(200).json({ message: "Chat unhidden successfully" });
  } catch (error) {
    console.log("Error in unhideChat controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getHiddenChatsForUser = async (req, res) => {
  try {
    const myId = req.user._id;

    const hiddenMessages = await Message.find({
      [`hiddenFor.${myId}`]: true,
    }).distinct(myId === "senderId" ? "receiverId" : "senderId"); // This might need refinement

    // The above distinct might not be enough. Let's get distinct users who have messages hidden for `myId`.
    const hiddenChatUsers = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: myId },
            { receiverId: myId },
          ],
          [`hiddenFor.${myId}`]: true,
        },
      },
      {
        $project: {
          otherUserId: {
            $cond: { if: { $eq: ["$senderId", myId] }, then: "$receiverId", else: "$senderId" }
          }
        }
      },
      {
        $group: {
          _id: "$otherUserId"
        }
      }
    ]);

    const userIds = hiddenChatUsers.map(user => user._id);

    const users = await User.find({ _id: { $in: userIds } }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getHiddenChatsForUser: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Update all unread messages from this user to read
    await Message.updateMany(
      {
        senderId: userToChatId,
        receiverId: myId,
        read: false
      },
      { read: true }
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.log("Error in markMessagesAsRead controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
