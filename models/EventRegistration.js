import mongoose from "mongoose"

const EventRegistrationSchema = new mongoose.Schema({
    fullName : String,
    collegeName : String,
    phone : String,
    email : String,
    degree : String,
    year : String,
    headForm : String,
});

export default mongoose.models("EventRegistration", EventRegistrationSchema)