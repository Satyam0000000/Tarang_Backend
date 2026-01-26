import connectDB from "../../utils/connectDB.js";
import PendingOrder from "../../models/PendingOrder.js";

export default async function handler(req, res) {
  // ✅ CORS headers (allow frontend to access this API)
  res.setHeader("Access-Control-Allow-Origin", "https://www.tarangclub.online");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // ✅ Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  const { orderId } = req.query;

  // Only GET allowed
  if (req.method !== "GET") {
    return res.status(405).json({ status: "FAILED" });
  }

  if (!orderId) {
    return res.status(400).json({ status: "FAILED" });
  }

  try {
    // 🔑 Connect to DB
    await connectDB();

    // 🔑 Read latest DB state (THIS IS THE FIX)
    const order = await PendingOrder.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ status: "FAILED" });
    }

    // ✅ Return DB truth (used by PaymentSuccess page)
    return res.status(200).json({
      status: order.status, // PAID | PENDING | FAILED
      paymentId: order.paymentId || null,
      details: {
        name: order.name,
        email: order.email,
        eventName: order.eventName,
        amount: order.amount,
        eventLink: order.eventLink || null,
      },
    });
  } catch (err) {
    console.error("verify-payment error:", err);
    return res.status(500).json({ status: "FAILED" });
  }
}