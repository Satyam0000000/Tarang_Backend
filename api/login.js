import connectDB from "../utils/connectDB";
import User from "../models/User";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import cors from "cors"

const corsMiddleware = cors({
    origin: "https://tarang-frontend.vercel.app",
    methods: ["POST"],
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

export default async function handler(req,res){

    await runMiddleware(req,res,corsMiddleware);

    if(req.method !== "POST")
        return res.status(405).json({message: "Method not allowed"})
    await connectDB();
    const {email, password} = req.body;
    
    try{
        const user = await User.findOne({email})
        if(!user)
            return res.json({success: false, message: "User not found"})

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch)
            return res.json({success: false, message: "Incorrect password"})
        const token = jwt.sign(
            {id: user._id, email: user.email},
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        );

        res.json({success: true, token, user});
    }catch (err){
        res.status(500).json({success: false, message: "Servor error"})
    }
}