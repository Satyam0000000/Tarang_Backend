import axios from "axios";
import Cors from "cors";

// ✅ Allowed origins
const allowedOrigins = [
  "https://tarang-frontend.vercel.app",
  "https://www.tarangclub.online",
];

// ✅ Initialize CORS
const cors = Cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "HEAD"],
  credentials: true,
});

// ✅ Middleware runner for serverless
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  // 🔴 FIX: cors must be executed
  await runMiddleware(req, res, cors);

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { orderId } = req.query;

  try {
    const response = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${orderId}`,
      {
        headers: {
          "x-client-id": process.env.CF_APP_ID,
          "x-client-secret": process.env.CF_SECRET_KEY,
          "x-api-version": "2023-08-01",
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Verification error:",
      error.response?.data || error.message
    );
    return res.status(500).json({ error: "Payment verification failed" });
  }
}