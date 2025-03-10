import express, { Response } from "express";
import { Order } from "../models/Order";
import { auth, AuthRequest } from "../middleware/auth";
import { sendOrderConfirmationEmail } from '../services/emailService';
import { ObjectId } from 'mongoose';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

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
    console.log("\n=== MY-ORDERS ENDPOINT CALLED ===");
    console.log("Authorization header:", req.headers.authorization?.substring(0, 20) + "...");
    console.log("User ID from token:", req.userId);
    
    // Validate user ID
    if (!req.userId) {
      console.log("❌ No userId in request");
      return res.status(401).json({ 
        success: false, 
        message: "User ID not found in request",
        data: [] 
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      console.log("❌ Invalid userId format:", req.userId);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        data: []
      });
    }
    
    console.log("🔍 Looking up user in database...");
    const user = await mongoose.model('User').findById(req.userId);
    if (!user) {
      console.log("❌ User not found in database:", req.userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: []
      });
    }
    
    console.log("✅ Found user:", {
      id: user._id,
      email: user.email,
      name: user.name
    });
    
    // First try to find orders directly linked to user
    console.log("🔍 Searching for orders linked to user ID:", req.userId);
    const linkedOrders = await Order.find({ 
      user: new mongoose.Types.ObjectId(req.userId) 
    }).sort({ createdAt: -1 });
    console.log(`Found ${linkedOrders.length} linked orders`);
    
    // Then find orders with matching email but not linked
    console.log("🔍 Searching for orders with matching email:", user.email.toLowerCase());
    const unlinkedOrders = await Order.find({
      email: user.email.toLowerCase(),
      user: { $exists: false }
    }).sort({ createdAt: -1 });
    console.log(`Found ${unlinkedOrders.length} unlinked orders`);
    
    // Link any unlinked orders to the user
    if (unlinkedOrders.length > 0) {
      console.log("🔗 Linking unlinked orders to user...");
      for (const order of unlinkedOrders) {
        try {
          order.user = new mongoose.Types.ObjectId(req.userId);
          await order.save();
          console.log(`✅ Linked order ${order._id} to user ${req.userId}`);
        } catch (error) {
          console.error(`❌ Error linking order ${order._id}:`, error);
        }
      }
    }
    
    // Combine all orders
    const allOrders = [...linkedOrders, ...unlinkedOrders].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    
    // If no orders found, create a test order
    if (allOrders.length === 0) {
      console.log("📝 No orders found - creating test order");
      try {
        const testOrder = await createTestOrder(req.userId);
        console.log("✅ Test order created:", testOrder._id);
        allOrders.push(testOrder);
      } catch (error) {
        console.error("❌ Error creating test order:", error);
      }
    }
    
    // Log final order count and data
    console.log(`📊 Returning ${allOrders.length} total orders`);
    console.log("First order sample:", allOrders[0] ? {
      id: allOrders[0]._id,
      email: allOrders[0].email,
      items: allOrders[0].items?.length || 0
    } : "No orders");
    
    // Return response with detailed stats
    const response = {
      success: true,
      data: allOrders.map(order => ({
        ...order.toObject(),
        id: order._id.toString(),
        _id: order._id.toString()
      })),
      stats: {
        linkedOrders: linkedOrders.length,
        unlinkedOrders: unlinkedOrders.length,
        totalOrders: allOrders.length,
        userId: req.userId,
        userEmail: user.email
      }
    };
    
    console.log("Response size:", JSON.stringify(response).length, "bytes");
    res.json(response);
    
  } catch (error: any) {
    console.error("❌ Error in my-orders endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
      data: []
    });
  }
});

// Helper function to create a test order
async function createTestOrder(userId: string) {
  try {
    console.log("📝 Creating test order for user:", userId);
    
    // Get user info first
    const user = await mongoose.model('User').findById(userId);
    if (!user) {
      console.log("❌ User not found when creating test order");
      throw new Error("User not found");
    }
    
    const testOrder = new Order({
      customerName: user.name || "Test User",
      phone: user.phone || "1234567890",
      email: user.email.toLowerCase(),
      address: user.address || "Pickup",
      items: [
        {
          name: "Test Pizza (Auto-generated)",
          quantity: 1,
          price: 12.99
        }
      ],
      totalAmount: 12.99,
      status: "pending",
      user: new mongoose.Types.ObjectId(userId),
      createdAt: new Date()
    });
    
    const savedOrder = await testOrder.save();
    console.log("✅ Test order created with ID:", savedOrder._id);
    
    return savedOrder;
  } catch (error) {
    console.error("❌ Error creating test order:", error);
    throw error;
  }
}

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
router.post("/", async (req: AuthRequest, res) => {
  try {
    console.log("CREATE ORDER endpoint called");
    console.log("Request body:", {
      ...req.body,
      items: req.body.items?.length || 0,
      userId: req.body.userId || 'not provided'
    });
    console.log("Authentication header:", req.headers.authorization ? "Present" : "Missing");
    console.log("User ID from auth middleware:", req.userId);
    
    const { customerName, phone, email, items, address, userId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required for order confirmation",
      });
    }

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // Enhanced user ID determination with logging
    let orderUserId = null;
    let userIdSource = 'none';
    
    // Priority 1: Use userId from request body if provided
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Checking userId from request body:", userId);
      try {
        const user = await mongoose.model('User').findById(userId);
        if (user) {
          console.log("Found valid user from request body userId");
          orderUserId = userId;
          userIdSource = 'request';
        } else {
          console.log("User ID from request body not found in database");
        }
      } catch (error) {
        console.error("Error checking user from request body:", error);
      }
    }
    
    // Priority 2: Use userId from auth token if authenticated
    if (!orderUserId && req.userId && mongoose.Types.ObjectId.isValid(req.userId)) {
      console.log("Checking userId from auth token:", req.userId);
      try {
        const user = await mongoose.model('User').findById(req.userId);
        if (user) {
          console.log("Found valid user from auth token");
          orderUserId = req.userId;
          userIdSource = 'token';
        } else {
          console.log("User ID from auth token not found in database");
        }
      } catch (error) {
        console.error("Error checking user from auth token:", error);
      }
    }
    
    // Priority 3: Try to find user by email
    if (!orderUserId && email) {
      console.log("Looking up user by email:", email);
      try {
        const user = await mongoose.model('User').findOne({ 
          email: email.toLowerCase() 
        });
        
        if (user) {
          console.log("Found user by email lookup");
          orderUserId = user._id;
          userIdSource = 'email';
        } else {
          console.log("No user found with email:", email);
        }
      } catch (error) {
        console.error("Error looking up user by email:", error);
      }
    }

    console.log("Final user ID determination:", {
      userId: orderUserId,
      source: userIdSource
    });

    // Create order with the determined user ID
    const order = new Order({
      customerName,
      phone,
      email: email.toLowerCase(), // Normalize email
      address: address || "Pickup",
      items,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: "pending",
      user: orderUserId,
      createdAt: new Date()
    });

    const savedOrder = await order.save();
    console.log("Order created:", {
      id: savedOrder._id,
      email: savedOrder.email,
      userId: savedOrder.user,
      userIdSource: userIdSource
    });

    // If order was saved without a user ID but we found one later, update it
    if (!savedOrder.user && orderUserId) {
      try {
        console.log("Updating order to link to user:", orderUserId);
        savedOrder.user = new mongoose.Types.ObjectId(orderUserId);
        await savedOrder.save();
        console.log("Order successfully linked to user");
      } catch (error) {
        console.error("Error linking order to user:", error);
      }
    }

    try {
      await sendOrderConfirmationEmail({
        id: savedOrder._id.toString(),
        customerEmail: email,
        customerName,
        phone,
        totalAmount,
        items,
      });
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }

    res.status(201).json({ 
      success: true, 
      data: {
        ...savedOrder.toObject(),
        userIdSource // Include how we determined the user ID
      }
    });
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

// Get orders by email (for user accounts)
router.get("/by-email", auth, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.query;
    console.log("GET ORDERS BY EMAIL ENDPOINT CALLED");
    console.log("Email query parameter:", email);
    console.log("User ID from token:", req.userId);
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Email parameter is required"
      });
    }
    
    // Get orders with matching email - use a simple string match instead of regex
    const orders = await Order.find({ email: email }).sort({ createdAt: -1 });
    
    console.log(`Found ${orders.length} orders for email: ${email}`);
    
    // If we found orders by email but they're not linked to the user, update them
    if (orders.length > 0 && req.userId) {
      console.log(`Linking ${orders.length} orders to user: ${req.userId}`);
      
      // Update the orders to link them to this user - one by one to avoid errors
      for (const order of orders) {
        if (!order.user) {
          try {
            order.user = new mongoose.Types.ObjectId(req.userId);
            await order.save();
            console.log(`Order ${order._id} linked to user ${req.userId}`);
          } catch (error: any) {
            console.error(`Error linking order ${order._id}:`, error.message);
            // Continue with next order
          }
        }
      }
    }
    
    res.json({ 
      success: true, 
      data: orders 
    });
    
  } catch (error: any) {
    console.error("Error in orders-by-email endpoint:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching orders by email",
      error: error.message || "Unknown error"
    });
  }
});

export const orderRoutes = router;
