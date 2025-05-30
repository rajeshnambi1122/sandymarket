import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { orderRoutes } from "./routes/orders";
import { authRoutes } from "./routes/auth";
import { gasPriceRoutes } from "./routes/gasprice";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Store connected admin clients
const adminClients = new Set<WebSocket>();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New admin client connected');
  
  // Add client to admin set
  adminClients.add(ws);

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Admin client disconnected');
    adminClients.delete(ws);
  });
});

// Function to notify all admin clients
export const notifyAdmins = (message: any) => {
  adminClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

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
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sandymarket')
  .then(() => {
    console.log('Connected to MongoDB');
    const port = process.env.PORT || 5000;
    httpServer.listen(port, () => {
      console.log(`Server is running on port ${port}`);
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
