import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createGroup, getGroupsForSidebar, deleteGroup } from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroupsForSidebar);
router.delete("/:id", protectRoute, deleteGroup);

export default router; 