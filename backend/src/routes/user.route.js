import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { searchUsers, searchGroups } from "../controllers/user.controller.js";

const router = express.Router();

// Search routes
router.get("/search", protectRoute, searchUsers);
router.get("/search/groups", protectRoute, searchGroups);

export default router; 