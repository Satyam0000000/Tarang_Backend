import connectDB from "../utils/connectDB.js";
import EventRegistration from "../models/EventRegistration.js"
import cors from "cors"
import { authMiddleware } from "../middleware/auth.js";

const allowedOrigins = [
    "https://tarang-frontend.vercel.app",
  "https://www.tarangclub.online",
];
const corsMiddleware = cors({
    origin: function (origin, callback){
        if(!origin || allowedOrigins.includes(origin)){
            callback(null, true);
        }else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["POST","OPTIONS"],
    credentials: true,
});

//middleware helper
function runMiddleware(req,res,fn){
    return new Promise((resolve, reject) => {
        fn(req,res, (result)=> {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        })
    })
}

export default async function handler(req,res) {

    console.log("🔥 registerEvent API HIT");
    await runMiddleware(req,res,corsMiddleware);

    // ✅ Allow CORS preflight requests
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // 🔐 Authenticate user via JWT (POST only)
    await authMiddleware(req, res);

    // ⛔ STOP execution if authMiddleware already sent a response (401)
    if (res.headersSent) {
        return;
    }

    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    await connectDB();

    try {
      const {
        eventId,
        eventName,
        amount,
        paymentStatus,
      } = req.body;

      // 🔑 Get trusted email from logged-in user
      const email = req.user.email;

      // ❌ Block paid registrations here
      if (amount > 0 || paymentStatus === "PAID") {
        return res.status(400).json({
          success: false,
          message: "Paid events are handled via payment gateway only",
        });
      }

      // ✅ Save FREE event only
      const registration = new EventRegistration({
        ...req.body,
        email,              // ✅ email from JWT / User DB
        amount: 0,
        paymentStatus: "FREE",
      });

      await registration.save();

      res.status(201).json({
        success: true,
        message: "Free event registration successful",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
}