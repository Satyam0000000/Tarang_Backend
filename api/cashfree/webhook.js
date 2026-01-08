import { Cashfree, CFEnvironment } from "cashfree-pg";
import connectDB from "../../utils/connectDB.js";
import PendingOrder from "../../models/PendingOrder.js";
import EventRegistration from "../../models/EventRegistration.js";

// 🚨 REQUIRED: disable bodyParser to access raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX, // change to PRODUCTION in live
  process.env.CF_APP_ID,
  process.env.CF_SECRET_KEY
);

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

    // 🔐 Verify Cashfree webhook signature
    cashfree.PGVerifyWebhookSignature(
      req.headers["x-webhook-signature"],
      rawBody,
      req.headers["x-webhook-timestamp"]
    );

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
          fullName: pending.name,
          email: pending.email,
          phone: pending.phone,
          eventId: pending.eventId,
          eventName: pending.eventName,
          amount: pending.amount,
          paymentStatus: "PAID",
          paymentId: cfPaymentId,
        });

        pending.status = "PAID";
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
