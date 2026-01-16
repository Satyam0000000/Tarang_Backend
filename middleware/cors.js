import cors from "cors";

const allowedOrigins = [
  "https://tarang-frontend.vercel.app",
  "https://www.tarangclub.online",
  "http://localhost:3000",
  "http://localhost:5173"
];

const corsMiddleware = cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["POST", "OPTIONS"],
  credentials: true,
});

export default corsMiddleware;