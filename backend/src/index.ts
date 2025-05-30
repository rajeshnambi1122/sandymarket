import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { orderRoutes } from "./routes/orders";
import { authRoutes } from "./routes/auth";
import { gasPriceRoutes } from "./routes/gasprice";
import { initializeWebSocket } from "./services/websocketService";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket
initializeWebSocket(httpServer);

// Middleware
app.use(
  cors({
    origin: '*',
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
    httpServer.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port ${process.env.PORT || 5000}`);
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
