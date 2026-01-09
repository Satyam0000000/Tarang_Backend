import User from "../models/User";
import connectDB from "../utils/connectDB";
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