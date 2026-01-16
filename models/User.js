import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: String,
    email: { type: String, unique: true },
    productId: String,
    examName: String,
    price: Number,
    orderId: String,
    password: String, // if login uses password
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model("User", userSchema);