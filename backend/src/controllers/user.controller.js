import User from "../models/user.model.js";
import Group from "../models/group.model.js";

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user._id;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Search users by username only, excluding the current user
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { username: { $regex: query, $options: "i" } }
      ]
    }).select("-password");

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error in searchUsers controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchGroups = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user._id;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Search groups by name where the current user is a member
    const groups = await Group.find({
      $and: [
        { members: currentUserId },
        { name: { $regex: query, $options: "i" } }
      ]
    }).populate("members", "username email");

    res.status(200).json({ groups });
  } catch (error) {
    console.error("Error in searchGroups controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}; 