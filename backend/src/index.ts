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

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://sandysmarket.up.railway.app',
      'https://sandymarketbackend.up.railway.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
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

const mongoUri = process.env.MONGODB_URI;

console.log("MONGODB_URI:", process.env.MONGODB_URI); // Add this line for debugging

if (!mongoUri) {
  console.error("MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

// MongoDB connection
mongoose
  .connect(mongoUri)
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
