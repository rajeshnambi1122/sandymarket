import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { orderRoutes } from "./routes/orders";
import { authRoutes } from "./routes/auth";
import { gasPriceRoutes } from "./routes/gasprice";
import { fuelRoutes } from "./routes/fuel";
import { startFuelMonitoring } from "./jobs/fuelMonitoringJob";
import { startDeliveryMonitoring } from "./jobs/deliveryMonitoringJob";
import { startGasBuddyPriceJob } from "./jobs/gasBuddyPriceJob";
import dotenv from "dotenv";
import 'dotenv/config'; // This loads .env automatically

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
app.use("/api/fuel", fuelRoutes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sandymarket')
  .then(() => {
    console.log('Connected to MongoDB');
    console.log('process.env.STORE_EMAILS', process.env.STORE_EMAILS);
    const port = process.env.PORT || 5000;
    httpServer.listen(port, () => {
      console.log(`Server is running on port ${port}`);

      // Start fuel monitoring cron job
      console.log('\n🚀 Starting fuel monitoring system...');
      startFuelMonitoring();
      
      // Start delivery monitoring cron job
      console.log('\n📦 Starting delivery monitoring system...');
      startDeliveryMonitoring();
      
      // Start Gas Buddy price comparison cron job
      console.log('\n💰 Starting Gas Buddy price comparison job...');
      startGasBuddyPriceJob();
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
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
