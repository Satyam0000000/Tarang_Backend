import axios from "axios";

export default async function handler(req, res) {
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
    console.error("Verification error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Payment verification failed" });
  }
}