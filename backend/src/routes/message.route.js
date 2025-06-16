import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, deleteChat, hideChat, deleteMessage, unhideChat, getHiddenChatsForUser, markMessagesAsRead } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/hidden-chats", protectRoute, getHiddenChatsForUser);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.put("/:id/read", protectRoute, markMessagesAsRead);
router.delete("/chat/:id", protectRoute, deleteChat);
router.delete("/message/:id", protectRoute, deleteMessage);
router.post("/hide/:id", protectRoute, hideChat);
router.post("/unhide/:id", protectRoute, unhideChat);

export default router;
