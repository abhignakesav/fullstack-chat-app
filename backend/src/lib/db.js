import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is undefined. Check your .env file.");
    }
    
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};