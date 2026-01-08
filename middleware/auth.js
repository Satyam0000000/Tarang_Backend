import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authMiddleware(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const token = authHeader.split(" ")[1];

    // 🔑 Verify JWT (matches login.js payload)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔍 Fetch user from DB
    const user = await User.findById(decoded.id).select("email name");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ Attach logged-in user to request
    req.user = user;
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
