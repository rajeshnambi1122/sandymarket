import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { orderRoutes } from "./routes/orders";
import { authRoutes } from "./routes/auth";
import { gasPriceRoutes } from "./routes/gasprice";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const allowedOrigins = [
  "https://sandymarket.up.railway.app", // Production frontend
  "http://localhost:8080", // Local development frontend (change the port if needed)
];

// Middleware
app.use(
  cors({
    origin: allowedOrigins, // Allows all origins
    credentials: true, // Include cookies, authentication headers
  })
);

app.use(express.json());

// Routes
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/gasprice", gasPriceRoutes);

// MongoDB connection options
const mongooseOptions = {
  retryWrites: true,
  w: "majority",
};

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit if cannot connect to database
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});
