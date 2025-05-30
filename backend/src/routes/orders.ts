import express, { Response } from "express";
import { Order } from "../models/Order";
import { auth, AuthRequest } from "../middleware/auth";
import { sendOrderConfirmationEmail } from '../services/emailService';
import { OrderItem } from '../types/order';
import { ObjectId } from 'mongoose';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { wsService } from '../services/websocketService';

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
    console.log("GET ORDER BY ID endpoint called for ID:", req.params.id);
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      console.log("Order not found with ID:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    
    console.log("Order retrieved successfully:", {
      id: order._id,
      customerName: order.customerName,
      itemsCount: order.items.length
    });
    
    // Check each item for toppings
    if (order.items && order.items.length > 0) {
      console.log("ORDER ITEMS WITH TOPPINGS:");
      order.items.forEach((item: any, index: number) => {
        console.log(`Item ${index}: ${item.name}`, {
          toppings: item.toppings || [],
          toppingsType: item.toppings ? typeof item.toppings : 'undefined',
          isArray: item.toppings && Array.isArray(item.toppings),
          size: item.size || null
        });
      });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Error retrieving order by ID:", error);
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
    
    // Log detailed item information including toppings
    console.log("ORDER ITEMS DETAILS WITH TOPPINGS:");
    if (req.body.items && Array.isArray(req.body.items)) {
      req.body.items.forEach((item: any, index: number) => {
        // First check if toppings exist and are an array
        const hasToppingsArray = item.toppings && Array.isArray(item.toppings);
        const toppingsCount = hasToppingsArray ? item.toppings.length : 0;
        
        console.log(`Item ${index}: ${item.name}`, {
          hasToppingsArray,
          toppingsCount,
          toppingsData: hasToppingsArray ? JSON.stringify(item.toppings) : 'NOT AN ARRAY',
          rawToppings: item.toppings, // Log the raw value
          size: item.size || null,
          quantity: item.quantity,
          price: item.price
        });
        
        // If it should have toppings but doesn't, log a warning
        if (item.name.includes('Topping') && (!hasToppingsArray || toppingsCount === 0)) {
          console.warn(`WARNING: Item ${item.name} should have toppings but has none or invalid format`);
        }
      });
    }
    
    console.log("Authentication header:", req.headers.authorization ? "Present" : "Missing");
    console.log("User ID from auth middleware:", req.userId);
    
    const { customerName, phone, email, items, address, userId, cookingInstructions } = req.body;

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
      (sum: number, item: OrderItem) => sum + item.price * item.quantity,
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

    // Create order with the determined user ID and safeguard toppings
    const processedItems = items.map((item: any) => {
      // Ensure toppings is always an array if present
      let safeToppings: string[] = [];
      if (item.toppings && Array.isArray(item.toppings)) {
        safeToppings = [...item.toppings]; // Make a copy
        console.log(`Order creation: Using toppings for ${item.name}:`, safeToppings);
      } else if (item.name.includes('Topping')) {
        console.warn(`Order creation: Item ${item.name} has invalid toppings format:`, item.toppings);
      }
      
      return {
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        size: item.size || undefined,
        toppings: safeToppings // Always use the safe array
      };
    });
    
    const order = new Order({
      customerName,
      phone,
      email: email.toLowerCase(), // Normalize email
      address: address || "Pickup",
      items: processedItems, // Use the processed items with safe toppings
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: "pending",
      user: orderUserId,
      cookingInstructions: cookingInstructions || '',
      createdAt: new Date()
    });

    const savedOrder = await order.save();
    console.log("Order created:", {
      id: savedOrder._id,
      email: savedOrder.email,
      userId: savedOrder.user,
      userIdSource: userIdSource
    });

    // Send WebSocket notification to admin
    wsService.sendNewOrderNotification(savedOrder);

    // Log the items with toppings for debugging
    console.log("Order items with toppings:");
    items.forEach((item: any, index: number) => {
      console.log(`Item ${index}: ${item.name}`, {
        toppings: item.toppings || [],
        size: item.size || null,
        quantity: item.quantity
      });
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
      // Make sure to explicitly include toppings and size in email data
      const orderItemsForEmail = processedItems.map((item: OrderItem) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        toppings: item.toppings || [],
        size: item.size || undefined
      }));
      
      console.log("Sending order confirmation with toppings data:",
        orderItemsForEmail.map((item: { name: string; toppings?: string[] }) => {
          return `${item.name} - toppings: ${(item.toppings || []).length}`;
        }).join(', '));
      
      await sendOrderConfirmationEmail({
        id: savedOrder._id.toString(),
        customerName: savedOrder.customerName,
        customerEmail: savedOrder.email,
        phone: savedOrder.phone,
        items: orderItemsForEmail,
        totalAmount: savedOrder.totalAmount,
        cookingInstructions: typeof savedOrder.cookingInstructions === 'string' ? savedOrder.cookingInstructions : undefined
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
      message: "Error creating order",
      error: error.message,
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
