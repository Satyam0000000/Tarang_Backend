import connectDB from "../utils/connectDB.js";
import EventRegistration from "../models/EventRegistration.js";
import { authMiddleware } from "../middleware/auth.js";
import User from "../models/User.js";
import corsMiddleware from "../middleware/cors.js";
import { runMiddleware } from "../utils/runMiddleware.js";

export default async function handler(req, res) {
  try {
    
    await runMiddleware(req, res, corsMiddleware);

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "GET") {
      return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    // ✅ DB
    await connectDB();

    // 🔐 AUTH
    const isAuthenticated = await authMiddleware(req, res);
    if (!isAuthenticated) return;

    const email = req.user.email;

    // ✅ Fetch current user details
    const user = await User.findOne({ email })
      .select("fullName email createdAt")
      .lean();

    console.log("📌 Fetching registrations for:", email);

    // ✅ Fetch all events registered by user
    const registrations = await EventRegistration.find({ email })
      .sort({ registeredAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      user,
      count: registrations.length,
      data: registrations,
    });

  } catch (err) {
    console.error("❌ Fetch registrations error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
    });
  }
}