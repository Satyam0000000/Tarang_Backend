import connectDB from "../utils/connectDB";
import User from "../models/User";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import cors from "cors"

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

export default async function handler(req,res){

    try{
    await runMiddleware(req,res,corsMiddleware);

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if(req.method !== "POST")
        return res.status(405).json({message: "Method not allowed"})
    await connectDB();
    const {email, password} = req.body;
    
    
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
        console.error("Login API error", err)
        return res.status(500).json({success: false, message: "Servor error"})
    }
}