import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./utils/db.js";
import authRouter from "./routes/auth.route.js";
import messagesRouter from './routes/messages.js';
import chatgptRouter from './routes/chatgpt.js';
import photosRouter from './routes/photos.js';

const app = express();

dotenv.config();

const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(express.json());
app.use(cookieParser());

// CORS Configuration - Only call once!
const corsOptions = {
  origin: "http://localhost:5173", // Your React frontend URL
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Routes
app.get("/user", (req, res) => {
  res.send("hello world");
});

app.use("/auth/v1", authRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/chatgpt", chatgptRouter);
app.use("/uploads/photos", photosRouter);

// Database connection and server start
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });
