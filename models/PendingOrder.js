import mongoose from "mongoose";

const PendingOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    // customer details
    customerId: {
      type: String,
      required: true,
    },
    name: String,
    email: String,
    phone: String,

    // registration details
    collegeName: String,
    degree: String,
    year: String,
    heardFrom: String,
    
    wantToSpeak: {
      type: String,
      enum: ["Favour of Motion", "Against the Motion"],
    },

    // event details
    eventId: {
      type: String,
      required: true,
    },
    eventName: {
      type: String,
      required: true,
    },

    // payment
    amount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    eventLink: {
      type: String,
    }
  },
  { timestamps: true }
);

export default mongoose.models.PendingOrder ||
  mongoose.model("PendingOrder", PendingOrderSchema);