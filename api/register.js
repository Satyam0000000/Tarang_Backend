import bcrypt from "bcrypt"
import connectDB from "../utils/connectDB.js"
import User from "../models/User"
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

export default async function handler(req,res) {

    await runMiddleware(req,res,corsMiddleware);

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