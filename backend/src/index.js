import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import notificationRoutes from "./routes/notification.route.js";
import groupRoutes from "./routes/group.route.js";
import userRoutes from "./routes/user.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();
// Remove sensitive information from logs
console.log("Environment loaded successfully");

const PORT = process.env.PORT || 5000;
// const __dirname = path.resolve(); // This line is also not needed if not serving frontend

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND,
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/users", userRoutes);

// Removed the block that serves frontend static files in production
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//   });
// }

server.listen(PORT, () => {
  console.log("Server is running on PORT:", PORT);
  connectDB();
});
