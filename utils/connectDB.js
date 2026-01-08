import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    throw new Error("MONGO_URI not defined in environment variables");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    // ✅ Return cached connection if available
    if (cached.conn) {
        console.log("✅ Using cached MongoDB connection");
        return cached.conn;
    }

    // ✅ If connection is in progress, wait for it
    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Disable Mongoose buffering
            maxPoolSize: 10, // Limit connection pool size
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 10000, // Close sockets after 10s of inactivity
            family: 4, // Use IPv4, skip trying IPv6
        };

        console.log("🔌 Establishing new MongoDB connection...");
        
        cached.promise = mongoose.connect(MONGO_URI, opts)
            .then((mongoose) => {
                console.log("✅ MongoDB connected successfully");
                return mongoose;
            })
            .catch((error) => {
                console.error("❌ MongoDB connection failed:", error.message);
                cached.promise = null; // Reset on failure
                throw error;
            });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        cached.promise = null; // Reset promise on error
        cached.conn = null;
        throw error;
    }
};

export default connectDB;