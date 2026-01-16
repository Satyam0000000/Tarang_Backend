import bcrypt from "bcrypt"
import connectDB from "../utils/connectDB.js"
import User from "../models/User.js"
import { Resend } from 'resend';
import corsMiddleware from "../middleware/cors.js";
import { runMiddleware } from "../utils/runMiddleware.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req,res) {
    
    
    try {
        await runMiddleware(req,res,corsMiddleware);
    } catch (corsError) {
        console.error("CORS Error:", corsError);
        return res.status(403).json({message: "CORS error"});
    }

    if (req.method !== "POST") {
        return res.status(405).json({message : "Method not allowed"});
    }

    try {
        console.log("Connecting to DB...");
        await connectDB();
        console.log("DB Connected");

        const {fullName, email, password} = req.body;
        console.log("Registration attempt for:", email);

        // Validate input
        if (!fullName || !email || !password) {
            return res.status(400).json({message: "All fields are required"});
        }

        const OTP = Math.floor(100000 + Math.random() * 900000);
        const OTP_expiry = Date.now() + 5 * 60 * 1000;

        console.log("Checking for existing user...");
        const existingUser = await User.findOne({email});
        if (existingUser) {
            console.log("User already exists");
            return res.status(400).json({message : "User already exists"});
        }

        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("Creating new user...");
        const newUser = new User({
            fullName, 
            email, 
            password: hashedPassword, 
            emailOTP: OTP, 
            otpExpiry: OTP_expiry, 
            isVerified: false
        });

        console.log("Saving user to database...");
        await newUser.save();
        console.log("User saved successfully");

        // Sending verification mail
        try {
            console.log("Sending email...");
            const emailResponse = await resend.emails.send({ // FIX: Added const emailResponse
                from: 'Tarang Club <noreply@tarangclub.online>',
                to: email,
                subject: 'OTP Verification - Tarang Club',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); padding: 30px; border-radius: 10px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Welcome to Tarang Club! 🎉</h1>
                        </div>
                        <div style="background-color: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <p style="font-size: 16px; color: #374151;">Hi ${fullName},</p>
                            <p style="font-size: 16px; color: #374151;">Thank you for registering! Please use the OTP below to verify your email address:</p>
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                                <p style="font-size: 32px; font-weight: bold; color: #8b5cf6; margin: 0; letter-spacing: 5px;">${OTP}</p>
                            </div>
                            <p style="font-size: 14px; color: #6b7280;">⏰ This OTP is valid for <strong>5 minutes</strong>.</p>
                            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
                        </div>
                        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                            <p>© ${new Date().getFullYear()} Tarang Club. All rights reserved.</p>
                        </div>
                    </div>
                `,
            });
            
            console.log("Email sent successfully:", emailResponse);
            return res.status(201).json({message: "OTP sent to mail"}); // FIX: Added return
            
        } catch (emailError) {
            console.error("Email sending failed:", emailError);
            // Delete the user if email fails
            await User.deleteOne({email});
            console.log("User deleted due to email failure");
            return res.status(500).json({
                message: "Failed to send OTP email. Please try again.",
                error: emailError.message // FIX: Was emailError.messag (typo)
            });
        }

    } catch (err) {
        console.error("Registration error:", err);
        return res.status(500).json({ // FIX: Added return
            message: "Registration failed", 
            error: err.message
        });
    }
}