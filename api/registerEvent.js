import connectDB from "../utils/connectDB.js";
import EventRegistration from "../models/EventRegistration.js";
import cors from "cors";
import { authMiddleware } from "../middleware/auth.js";

const allowedOrigins = [
  "https://tarang-frontend.vercel.app",
  "https://www.tarangclub.online",
  "http://localhost:3000",
  "http://localhost:5173"
];

const corsMiddleware = cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["POST", "OPTIONS"],
  credentials: true,
});

// Middleware helper
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  console.log("🔥 registerEvent API HIT");
  console.log("📍 Method:", req.method);
  console.log("🔐 Auth header exists:", !!req.headers.authorization);

  try {
    // ✅ Handle CORS
    await runMiddleware(req, res, corsMiddleware);

    // ✅ Allow CORS preflight requests
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "POST") {
      return res.status(405).json({ 
        success: false,
        message: "Method not allowed" 
      });
    }

    // ✅ Connect DB BEFORE auth (required for User query)
    console.log("🔌 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected");

    // 🔐 Authenticate user via JWT
    console.log("🔐 Authenticating user...");
    const isAuthenticated = await authMiddleware(req, res);
    
    // ✅ CRITICAL: Stop if auth failed
    if (!isAuthenticated) {
      console.log("⛔ Authentication failed, stopping execution");
      return; // Auth middleware already sent error response
    }

    console.log("✅ User authenticated:", req.user.email);

    // ✅ Extract and validate request body
    const {
      fullName,
      collegeName,
      phone,
      degree,
      year,
      heardFrom,
      eventId,
      eventName,
      amount,
      paymentStatus,
    } = req.body;

    console.log("📝 Registration request:", {
      fullName,
      eventName,
      email: req.user.email,
      amount,
      paymentStatus
    });

    // ✅ Validate required fields
    if (!fullName || !collegeName || !phone || !degree || !year || !heardFrom || !eventId || !eventName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // ❌ Block paid registrations
    if (amount > 0 || paymentStatus === "PAID") {
      console.log("❌ Blocked paid registration attempt");
      return res.status(400).json({
        success: false,
        message: "Paid events are handled via payment gateway only",
      });
    }

    // ✅ Check for duplicate registration
    const existingReg = await EventRegistration.findOne({
      email: req.user.email,
      eventId: eventId
    }).maxTimeMS(5000).lean();

    if (existingReg) {
      console.log("⚠️ User already registered for this event");
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event",
      });
    }

    // ✅ Save FREE event registration
    const registration = new EventRegistration({
      fullName,
      collegeName,
      phone,
      degree,
      year,
      heardFrom,
      eventId,
      eventName,
      email: req.user.email, // ✅ Email from JWT
      amount: 0,
      paymentStatus: "FREE",
      registeredAt: new Date()
    });

    console.log("💾 Saving registration...");
    await registration.save();
    console.log("✅ Registration saved successfully");

    return res.status(201).json({
      success: true,
      message: "Free event registration successful",
      data: {
        eventName,
        email: req.user.email,
        registeredAt: registration.registeredAt
      }
    });

  } catch (err) {
    console.error("❌ Registration error:", err.name, "-", err.message);
    
    return res.status(500).json({
      success: false,
      message: "Registration failed: " + err.message,
    });
  }
}