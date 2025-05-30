import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { orderRoutes } from "./routes/orders";
import { authRoutes } from "./routes/auth";
import { gasPriceRoutes } from "./routes/gasprice";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);

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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

// MongoDB connection options
const mongooseOptions = {
  retryWrites: true,
  w: "majority",
};

const mongoUri = process.env.MONGODB_URI;

console.log("Attempting to connect to MongoDB...");

if (!mongoUri) {
  console.error("MONGODB_URI is not defined in environment variables");
  // Don't exit, just log the error
  console.error("Server will start but database operations will fail");
}

// MongoDB connection
mongoose
  .connect(mongoUri || '')
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    const port = process.env.PORT || 5000;
    httpServer.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    // Don't exit, just log the error
    console.error("Server will start but database operations will fail");
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  // Don't exit, just log the error
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  // Don't exit, just log the error
});
