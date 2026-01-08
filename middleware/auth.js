import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authMiddleware(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ 
        success: false,
        message: "Not authenticated - No token provided" 
      });
      return false; // ✅ Return false to signal auth failed
    }

    const token = authHeader.split(" ")[1];

    console.log("JWT_SECRET:", process.env.JWT_SECRET);

    // 🔑 Verify JWT (matches login.js payload)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified, User ID:", decoded.id);

    // 🔍 Fetch user from DB with timeout and lean()
    console.log("🔍 Fetching user from database...");
    
    const user = await User.findById(decoded.id)
      .select("email name")
      .maxTimeMS(5000) // ✅ 5 second timeout
      .lean() // ✅ Return plain JS object (faster)
      .exec(); // ✅ Execute immediately

    if (!user) {
      console.log("❌ User not found for ID:", decoded.id);
      res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
      return false; // ✅ Return false to signal auth failed
    }

    console.log("✅ User authenticated:", user.email);

    // ✅ Attach logged-in user to request
    req.user = {
      id: decoded.id,
      email: user.email,
      name: user.name
    };

    return true; // ✅ Return true to signal success

  } catch (error) {
    console.error("❌ Auth error:", error.name, "-", error.message);
    
    // Handle specific errors
    if (error.name === "JsonWebTokenError") {
      res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    } else if (error.name === "TokenExpiredError") {
      res.status(401).json({ 
        success: false,
        message: "Token expired" 
      });
    } else if (error.message?.includes("buffering timed out") || error.message?.includes("timed out")) {
      res.status(503).json({ 
        success: false,
        message: "Database timeout - please try again" 
      });
    } else {
      res.status(401).json({ 
        success: false,
        message: "Authentication failed" 
      });
    }
    
    return false; // ✅ Return false to signal auth failed
  }
}