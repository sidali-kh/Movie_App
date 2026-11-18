
import mongoose from "mongoose";
import env from "@/config/env.js";

async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `MongoDB connected successfully: ${mongoose.connection.host}`
    );
  } catch (error: unknown) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export default connectDB;
