import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const adminId = req.user._id; 

    if (!name || !members || !Array.isArray(members) || members.length < 2) {
      return res.status(400).json({ error: "Please provide a group name and at least two members." });
    }

    if (!members.includes(adminId.toString())) {
      members.push(adminId.toString());
    }

    const newGroup = new Group({
      name,
      members,
    });

    await newGroup.save();

    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error in createGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupsForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const groups = await Group.find({ members: loggedInUserId }).select("-members");

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getGroupsForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.members.includes(userId.toString())) {
      return res.status(403).json({ error: "You are not authorized to delete this group." });
    }

    await Message.deleteMany({ group: groupId });

    await Group.deleteOne({ _id: groupId });

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}; 