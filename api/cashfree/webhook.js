import crypto from "crypto";
import connectDB from "../../utils/connectDB.js";
import PendingOrder from "../../models/PendingOrder.js";
import EventRegistration from "../../models/EventRegistration.js";

// 🚨 REQUIRED: disable bodyParser to access raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

function verifySignature(req, rawBody) {
  const timestamp = req.headers["x-webhook-timestamp"];
  const receivedSignature = req.headers["x-webhook-signature"];

  if (!timestamp || !receivedSignature) {
    throw new Error("Missing webhook headers");
  }

  const secretKey = process.env.CF_SECRET_KEY; // Cashfree client secret
  const signStr = timestamp + rawBody;

  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(signStr)
    .digest("base64");

  if (expectedSignature !== receivedSignature) {
    throw new Error("Signature mismatch");
  }
}

export default async function handler(req, res) {
  // Cashfree always sends POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // 🔴 Read RAW request body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);

    // Verify signature (HMAC SHA256)
    try {
      verifySignature(req, rawBody.toString());
      console.log(" Signature verified");
    } catch (err) {
      console.error(" Signature verification failed:", err.message);
      return res.status(200).json({ received: true, error: "Invalid signature" });
    }

    await connectDB();

    const event = JSON.parse(rawBody.toString());
    const { type, data } = event;
    console.log("Webhook type received:", type);

    console.log("✅ Cashfree webhook received:", type);

    // ✅ Payment success (supports Cashfree v2025-01-01)
    if (type && type.includes("PAYMENT_SUCCESS")) {
      const orderId = data.order.order_id;
      const cfPaymentId = data.payment.cf_payment_id;

      const pending = await PendingOrder.findOne({ orderId });

      if (pending && pending.status !== "PAID") {
        await EventRegistration.create({
          // User details
          fullName: pending.fullName || pending.name || null,
          collegeName: pending.collegeName || null,
          phone: pending.phone || null,
          email: pending.email || null,
          degree: pending.degree || null,
          year: pending.year || null,
          heardFrom: pending.heardFrom || null,
          wantToSpeak: pending.wantToSpeak || null,

          // Event details
          eventId: pending.eventId,
          eventName: pending.eventName,
          eventLink: pending.eventLink || null,

          // Payment details
          amount: pending.amount || 0,
          paymentStatus: "PAID",
          paymentId: cfPaymentId,

          // Order status (extra safety)
          status: pending.status || "PAID",
        });

        pending.status = "PAID";
        pending.paymentId = cfPaymentId; // ✅ save paymentId in PendingOrder
        await pending.save();
      }
    }

    // ❌ Payment failed
    if (type === "PAYMENT_FAILED") {
      const orderId = data.order.order_id;
      await PendingOrder.findOneAndUpdate(
        { orderId },
        { status: "FAILED" }
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Cashfree webhook error:", err.message);
    return res.status(400).json({ message: "Webhook verification failed" });
  }
}
