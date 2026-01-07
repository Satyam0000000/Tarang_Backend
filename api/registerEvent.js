import connectDB from "../utils/connectDB";
import EventRegistration from "../models/EventRegistration"
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

if(req.method !== "POST")
    return res.status(405).json({message: "Method not allowed"});
await connectDB();

try{
    const registration = new EventRegistration(req.body);
    await registration.save();
    res.status(201).json({success: true, message: "registration succesfull"})
}catch (err){
    res.status(500).json({success: false, message: err.message});
}
}