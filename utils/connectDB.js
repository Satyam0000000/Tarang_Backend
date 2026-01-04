import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

if(!MONGO_URI){
    throw new Error("MONGO_URI not defined")
}
let cached = global.mongoose;
if(!cached) {
    cached = global.mongoose = { conn: null, promise: null};
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }
    if(!cached.promise) {
        cached.promise = mongoose.connect(MONGO_URI, {
            bufferCommands: false,
        })
        .then((mongoose) => mongoose);
    }

    cached.conn = await cached.promise;
    console.log("MongoDB connected")
};
export default connectDB;