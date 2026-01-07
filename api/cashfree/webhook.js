import express from "express";
import bodyParser from "body-parser";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import connectDB from "../../utils/connectDB.js";
import PendingOrder from "../../models/PendingOrder.js";
import EventRegistration from "../../models/EventRegistration.js";

const router = express.Router();

// 🔴 Raw body middleware (REQUIRED for Cashfree)
router.use(
  bodyParser.raw({
    type: "*/*",
  })
);

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX, // change to PRODUCTION in live
  process.env.CF_APP_ID,
  process.env.CF_SECRET_KEY
);

router.post("/cashfree/webhook", async (req, res) => {
  try {
    // 🔐 Verify webhook signature (official Cashfree method)
    cashfree.PGVerifyWebhookSignature(
      req.headers["x-webhook-signature"],
      req.body,
      req.headers["x-webhook-timestamp"]
    );

    // ✅ Signature verified
    await connectDB();

    const event = JSON.parse(req.body.toString());
    const { type, data } = event;

    // ✅ Handle successful payment
    if (type === "PAYMENT_SUCCESS") {
      const orderId = data.order?.order_id;
      const cfPaymentId = data.payment?.cf_payment_id;

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

    // ❌ Handle failed payment
    if (type === "PAYMENT_FAILED") {
      const orderId = data.order?.order_id;
      await PendingOrder.findOneAndUpdate(
        { orderId },
        { status: "FAILED" }
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Cashfree webhook verification failed:", err.message);
    return res.status(400).json({ message: "Invalid webhook signature" });
  }
});

export default router;
