import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, deleteChat, deleteMessage, markMessagesAsRead, getGroupMessages, sendGroupMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.get("/group/:id", protectRoute, getGroupMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.post("/group/:id/send", protectRoute, sendGroupMessage);
router.put("/:id/read", protectRoute, markMessagesAsRead);
router.delete("/chat/:id", protectRoute, deleteChat);
router.delete("/message/:id", protectRoute, deleteMessage);

export default router;
