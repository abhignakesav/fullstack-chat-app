import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getNotifications, markNotificationAsRead } from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.put("/:id/read", protectRoute, markNotificationAsRead);

export default router; 