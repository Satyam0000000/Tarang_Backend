import bcrypt from "bcrypt"
import connectDB from "../utils/connectDB"
import User from "../models/User"

export default async function handler(req,res) {
    if (req.method !== "POST")
        return res.status(405).json({message : "Method not allowed"})

    await connectDB();
    const {fullName, email, password} = req.body;

    try{
        const existingUser = await User.findOne({email});
        if (existingUser)
            return res.status(400).json({message : "User already exists"})
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({fullName, email, password: hashedPassword})
        await newUser.save();
        res.status(201).json({message: "Registration successfull"})
    }catch (err){
        res.status(500).json({message: "Registration failed", error: err.mesaage})
    }
}