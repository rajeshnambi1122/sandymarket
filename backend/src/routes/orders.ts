import express, { Response } from "express";
import { Order } from "../models/Order";
import { auth, AuthRequest } from "../middleware/auth";
import { sendOrderConfirmationEmail } from '../services/emailService';
import { ObjectId } from 'mongoose';

const router = express.Router();

// Get all orders
router.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
});

// Get user's orders
router.get("/my-orders", auth, async (req: AuthRequest, res: Response) => {
  try {
    console.log("Fetching orders for user:", req.userId); // Debug log

    // Find all orders since we made user optional
    const orders = await Order.find({
      $or: [
        { user: req.userId },
        { user: null, customerName: { $exists: true } },
      ],
    }).sort({ createdAt: -1 });

    console.log("Found orders:", orders); // Debug log

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
    });
  }
});

// Get all orders (for admin)
router.get("/admin", auth, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error: any) {
    console.error("Error fetching admin orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

// Get order by ID (for customers to check status)
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching order",
    });
  }
});

// Create new order (for customers)
router.post("/", async (req, res) => {
  try {
    const { customerName, phone, email, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // Round totalAmount to two decimal places
    const roundedTotalAmount = Math.round(totalAmount * 100) / 100;

    const order = new Order({
      customerName,
      phone,
      email,
      items,
      totalAmount: roundedTotalAmount,
      status: "pending",
      user: null, // Make user optional for now
    });

    const savedOrder = await order.save();

    // Send confirmation email
    await sendOrderConfirmationEmail({
      id: savedOrder._id.toString(),
      customerEmail: email,
      totalAmount: roundedTotalAmount,
      items,
    });

    res.status(201).json({ success: true, data: savedOrder });
  } catch (error: any) {
    console.error("Error creating order:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error creating order",
    });
  }
});

// Update order status (for admin)
router.patch("/:id", auth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log("Updating order:", { id, status }); // Debug log

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      console.log("Order not found"); // Debug log
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("Order updated:", order); // Debug log
    res.json({ success: true, data: order });
  } catch (error: any) {
    console.error("Error updating order:", error); // Debug log
    res.status(400).json({
      success: false,
      message: "Error updating order",
      error: error.message,
    });
  }
});

export const orderRoutes = router;
