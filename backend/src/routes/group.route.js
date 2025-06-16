import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createGroup, getGroupsForSidebar } from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroupsForSidebar);

export default router; 