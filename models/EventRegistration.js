import mongoose from "mongoose"

const EventRegistrationSchema = new mongoose.Schema(
  {
    fullName: String,
    collegeName: String,
    phone: String,
    email: String,
    degree: String,
    year: String,
    heardFrom: String,

    // Event details
    eventId: {
      type: String,
      required: true,
    },
    eventName: {
      type: String,
      required: true,
    },

    // Payment details
    amount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["FREE", "PAID"],
      required: true,
    },
    paymentId: {
      type: String, // Cashfree cf_payment_id
    },
  },
  { timestamps: true }
);

export default mongoose.models.EventRegistration ||
  mongoose.model("EventRegistration", EventRegistrationSchema);