
import connectDB from "../utils/connectDB.js";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173"
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { amount, customer, productId, examName } = req.body;

    const fullName = customer?.name;
    const email = customer?.id;
    const price = amount;

    const orderId = "ORDER_" + Date.now();

    // saving order/user data in DB
    await User.create({
      fullName,
      email,
      productId,
      examName,
      price,
      orderId,
    });

    return res.status(200).json({
      success: true,
      orderId,
    });
  } catch (error) {
    console.error("create-order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
}