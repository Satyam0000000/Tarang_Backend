import connectDB from "../utils/connectDB";
import EventRegistration from "../models/EventRegistration"

export default async function handler(req,res) {
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