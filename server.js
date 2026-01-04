import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const app = express();
const corsOptions = {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  };
  
// Enable CORS with the defined options
app.use(cors(corsOptions));
app.use(cors()); 
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb+srv://satyamgoswami2705_db_user:BMPcpqh8tbVJsodt@cluster0.ilyawmp.mongodb.net/Debate_Management?appName=Cluster0")
  .then(() => console.log(" MongoDB Connected"))
  .catch((err) => console.log(" DB Error:", err));

  mongoose.connection.once("open", () => {
  console.log("Connected DB:", mongoose.connection.name);
});

// Schema and Model
const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
});

const EventRegistrationSchema = new mongoose.Schema({
  fullName: String,
  collegeName: String,
  phone: String,
  email: String,
  degree: String,
  year: String,
  heardFrom: String,
});
const EventRegistration = mongoose.model("EventRegistration", EventRegistrationSchema);

const User = mongoose.model("User", userSchema);

// Register route
app.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    res.status(500).json({ message: "Error registering user", error: err });
  }
});
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) return res.json({ success: false, message: "User not found" });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.json({ success: false, message: "Incorrect password" });
  
     
      const token = jwt.sign(
        { id: user._id, email: user.email },
        "your_jwt_secret",
        { expiresIn: "7d" }
      );
  
      // send token + user to frontend
      res.json({ success: true, message: "Login successful", token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

app.post("/registerevent", async (req, res) => {
  try {
    const registration = new EventRegistration(req.body);
    await registration.save();
    res.status(201).json({ success: true, message: "Event registration successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error saving registration", error: err });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
console.log("Hllo")