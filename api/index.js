import express from "express"
import cors from "cors"

const app = express();

app.use(
    cors({
        origin: "https://tarang-frontend.vercel.app",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
    })
);

app.options("*", cors());

app.use(express.json());
app.get("/", (req,res) => {
    res.json({message: "API working"})
})

export default app;