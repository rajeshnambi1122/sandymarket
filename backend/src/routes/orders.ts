import express, { Response } from "express";
import { Order } from "../models/Order";
import { auth, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Get all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// Create new order (now requires auth)
router.post("/", auth, async (req: AuthRequest, res: Response) => {
  try {
    console.log("Received order request:", req.body);
    const { customerName, phone, address, items } = req.body;

    if (!items || items.length === 0) {
      console.log("No items in order");
      return res
        .status(400)
        .json({ message: "Order must contain at least one item" });
    }

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; price: number }) =>
        sum + item.quantity * item.price,
      0
    );

    const order = new Order({
      customerName,
      phone,
      address,
      items,
      totalAmount,
      status: "pending",
      user: req.userId, // assign the logged in user
    });

    console.log("Creating order:", order);
    const savedOrder = await order.save();
    console.log("Order saved:", savedOrder);

    res.status(201).json(savedOrder);
  } catch (error: any) {
    console.error("Error creating order:", error);
    res.status(400).json({
      message: "Error creating order",
      error: error?.message || "Unknown error",
    });
  }
});

// Update order status
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: "Error updating order" });
  }
});

// Get current user's orders
router.get("/my-orders", auth, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export const orderRoutes = router;
