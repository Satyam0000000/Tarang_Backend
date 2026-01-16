import User from "../models/User.js";
import connectDB from "../utils/connectDB.js";
import corsMiddleware from "../middleware/cors.js";
import { runMiddleware } from "../utils/runMiddleware.js";

export default async function handler(req,res){

    await runMiddleware(req,res,corsMiddleware);

    if (req.method !== "POST")
        return res.status(405).json({message : "Method not allowed"})


try {
    await connectDB();
    const {email, email_OTP} = req.body

    const newUser = await User.findOne({email})

    if (!newUser)
        return res.status(404).json({ message: "User not found" });
    if(Date.now() > newUser.otpExpiry )
        return res.status(400).json({message: "OTP Expired"})
    if(Number(newUser.emailOTP) !== Number(email_OTP))
        return res.status(400).json({message: "OTP Incorrect"})

    newUser.isVerified = true;
    newUser.emailOTP = null;
    newUser.otpExpiry = null;
    await newUser.save();

    return res.status(200).json({ message: "OTP verified successfully" });
} catch (error) {
    console.log("OTP verification error",error)
    return res.status(400).json({message: "OTP verification error"})
}

}