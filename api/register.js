import bcrypt from "bcrypt"
import connectDB from "../utils/connectDB.js"
import User from "../models/User.js"
import cors from "cors"
import { Resend } from 'resend';

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
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req,res) {

    await runMiddleware(req,res,corsMiddleware);

    if (req.method !== "POST")
        return res.status(405).json({message : "Method not allowed"})

    await connectDB();
    const {fullName, email, password} = req.body;
    const OTP = Math.floor(100000 + Math.random() * 900000);
    const OTP_expiry = Date.now() + 5 * 60 * 1000

    try{
        const existingUser = await User.findOne({email});
        if (existingUser)
            return res.status(400).json({message : "User already exists"})

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({fullName, email, password: hashedPassword, emailOTP: OTP, otpExpiry: OTP_expiry, isVerified: false})

        await newUser.save();

        //sending verification mail
         
        try{
            await resend.emails.send({
                from: 'Tarang Club <noreply@tarangclub.online>',
                to: email,
                subject: 'OTP verification',
                html: `<p>Your OTP is <strong>${OTP}</strong></p>
                        <p>Valid for 5 minutes.</p>`,
            });
        console.log("Email sent successfully:", emailResponse);
        res.status(201).json({message: "OTP sent to mail"})
        
        } catch (emailError){
            console.error("Email sending failed:", emailError);
            // Delete the user if email fails
            await User.deleteOne({email});
            return res.status(500).json({
                message: "Failed to send OTP email. Please try again.",
                error: emailError.messag
        })

    }}catch (err){
        console.error("Registration error:", err);
        res.status(500).json({message: "Registration failed", error: err.message})
    }
}