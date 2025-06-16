import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, deleteChat, hideChat, deleteMessage, unhideChat, getHiddenChatsForUser } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.delete("/chat/:id", protectRoute, deleteChat);
router.delete("/message/:id", protectRoute, deleteMessage);
router.post("/hide/:id", protectRoute, hideChat);
router.post("/unhide/:id", protectRoute, unhideChat);
router.get("/hidden-chats", protectRoute, getHiddenChatsForUser);

export default router;
