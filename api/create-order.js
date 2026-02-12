import axios from "axios";
import cors from "cors";
import connectDB from "../utils/connectDB.js";
import { authMiddleware } from "../middleware/auth.js";
import PendingOrder from "../models/PendingOrder.js";
import corsMiddleware from "../middleware/cors.js";
import { runMiddleware} from "../utils/runMiddleware.js";

export default async function handler(req, res) {

  await runMiddleware(req, res, corsMiddleware);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("🔌 Connecting to database...");
  await connectDB();
  console.log("✅ Database connected");

  console.log("🔐 Authenticating user...");
  const isAuthenticated = await authMiddleware(req, res);
  if (!isAuthenticated) return;

  console.log("✅ User authenticated:", req.user.email);

  try {
    const { amount, customer, registration, event } = req.body;

    console.log("Backend received body:", req.body);

    if (!customer?.id) {
      return res.status(400).json({
        error: "customer.id is required for Cashfree payment",
      });
    }

    if (!amount || !customer) {
      return res.status(400).json({ error: "Missing amount or customer data" });
    }

    const orderId = "ORDER_" + Date.now();

    // 🔹 Save pending order BEFORE payment
    await PendingOrder.create({
      orderId,
      customerId: customer.id,
      name: customer.name,
      email: req.user.email,
      phone: customer.phone,

      // registration details
      collegeName: registration?.collegeName,
      degree: registration?.degree,
      year: registration?.year,
      heardFrom: registration?.heardFrom,
      wantToSpeak: registration?.wantToSpeak,

      // event details
      eventId: event?.eventId,
      eventName: event?.eventName,
      eventLink: event?.eventLink,

      amount,
      status: "PENDING",
    });

    // Add this right before axios.post
console.log("Sending to Cashfree:");
console.log("APP_ID:", process.env.CF_APP_ID);
console.log("SECRET_KEY:", process.env.CF_SECRET_KEY ? "EXISTS" : "MISSING");
console.log("Payload:", JSON.stringify({
  order_id: orderId,
  order_amount: amount,
  order_currency: "INR",
  customer_details: {
    customer_id: String(customer.id),
    customer_name: customer.name,
    customer_email: req.user.email,
    customer_phone: customer.phone,
  }
}, null, 2));



    const response = await axios.post(
      "https://api.cashfree.com/pg/orders",
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: String(customer.id),
          customer_name: customer.name,
          customer_email: req.user.email,
          customer_phone: customer.phone,
        },
       order_meta: {
        return_url: "https://www.tarangclub.online/payment-success?order_id={order_id}",
        },
      },
      {
        headers: {
          "x-client-id": process.env.CF_APP_ID,
          "x-client-secret": process.env.CF_SECRET_KEY,
          "x-api-version": "2023-08-01",
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Cashfree order error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Cashfree order creation failed" });
  }
}
