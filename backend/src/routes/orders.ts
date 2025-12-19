import express, { Response } from "express";
import { Order } from "../models/Order";
import { auth, AuthRequest, adminAuth } from "../middleware/auth";
import { sendOrderConfirmationEmail } from '../services/resendEmailService';
import { sendNewOrderNotification } from '../services/notificationService';
import { OrderItem } from '../types/order';
import mongoose from 'mongoose';

const router = express.Router();

// Get all orders
router.get("/", adminAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching orders" });
  }
});

// Get user's orders
router.get("/my-orders", auth, async (req: AuthRequest, res: Response) => {
  try {


    // Validate user ID
    if (!req.user?.userId) {

      return res.status(401).json({
        success: false,
        message: "User ID not found in request",
        data: []
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.user?.userId)) {

      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        data: []
      });
    }


    const user = await mongoose.model('User').findById(req.user?.userId);
    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User not found",
        data: []
      });
    }



    // First try to find orders directly linked to user

    const linkedOrders = await Order.find({
      user: new mongoose.Types.ObjectId(req.user?.userId)
    }).sort({ createdAt: -1 });


    // Then find orders with matching email but not linked

    const unlinkedOrders = await Order.find({
      email: user.email.toLowerCase(),
      user: { $exists: false }
    }).sort({ createdAt: -1 });


    // Link any unlinked orders to the user
    if (unlinkedOrders.length > 0) {

      for (const order of unlinkedOrders) {
        try {
          order.user = new mongoose.Types.ObjectId(req.user?.userId);
          await order.save();

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
        userId: req.user?.userId,
        userEmail: user.email
      }
    };


    return res.json(response);

  } catch (error: any) {
    console.error("❌ Error in my-orders endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
      data: []
    });
  }
});

// Get order by ID (for customers to check status)
// Requires authentication
// Admins can view any order, regular users can only view orders matching their email
router.get("/:id", auth, async (req: AuthRequest, res: Response) => {
  try {
    // Skip if the ID is 'my-orders' to avoid route conflicts
    if (req.params.id === 'my-orders') {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if user is admin first
    const isAdmin = req.user.role === 'admin' || req.user.role === 'admin1';

    const order = await Order.findById(req.params.id);

    // If order not found
    if (!order) {
      // Admins see "Order not found"
      if (isAdmin) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
      // Regular users see "Access denied" (don't leak info about order existence)
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own orders.",
      });
    }

    // Admins can view any order
    if (isAdmin) {
      return res.json({ success: true, data: order });
    }

    // For regular users, check if order email matches their email
    try {
      const user = await mongoose.model('User').findById(req.user.userId);
      if (!user || !user.email) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Unable to verify user email.",
        });
      }

      // Check if order email matches user email
      if (order.email && order.email.toLowerCase() === user.email.toLowerCase()) {
        return res.json({ success: true, data: order });
      }

      // Email doesn't match - return access denied (don't leak that order exists)
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own orders.",
      });
    } catch (error) {
      console.error("Error checking user email:", error);
      return res.status(500).json({
        success: false,
        message: "Error verifying access",
      });
    }
  } catch (error) {
    console.error("Error retrieving order by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching order",
    });
  }
});

// Create new order (for customers)
router.post("/", auth, async (req: AuthRequest, res) => {
  try {
    const { customerName, phone, email, items, address, userId, cookingInstructions, deliveryType } = req.body;

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

    // Calculate coupon discount if code is provided
    let finalTotalAmount = totalAmount;
    let discountAmount = 0;
    let isCouponApplied = false;
    let activeCouponPercentage = 0;
    const { couponCode } = req.body;

    if (couponCode && process.env.COUPON_CODE && couponCode.toUpperCase() === process.env.COUPON_CODE.toUpperCase()) {
      const couponPercentage = Number(process.env.COUPON_PERCENTAGE) || 0;

      // Calculate pizza subtotal for discount
      const pizzaSubtotal = items
        .filter((item: OrderItem) => item.name.toLowerCase().includes('pizza'))
        .reduce((sum: number, item: OrderItem) => sum + item.price * item.quantity, 0);

      if (pizzaSubtotal > 0) {
        discountAmount = (pizzaSubtotal * couponPercentage) / 100;
        finalTotalAmount = totalAmount - discountAmount;
        isCouponApplied = true;
        activeCouponPercentage = couponPercentage;
      }
    }

    // Enhanced user ID determination with logging
    let orderUserId = null;
    let userIdSource = 'none';

    // Priority 1: Use userId from request body if provided
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const user = await mongoose.model('User').findById(userId);
        if (user) {
          orderUserId = userId;
          userIdSource = 'request';
        }
      } catch (error) {
        console.error("Error checking user from request body:", error);
      }
    }

    // Priority 2: Use userId from auth token if authenticated
    if (!orderUserId && req.user?.userId && mongoose.Types.ObjectId.isValid(req.user?.userId)) {
      try {
        const user = await mongoose.model('User').findById(req.user?.userId);
        if (user) {
          orderUserId = req.user?.userId;
          userIdSource = 'token';
        }
      } catch (error) {
        console.error("Error checking user from auth token:", error);
      }
    }

    // Priority 3: Try to find user by email
    if (!orderUserId && email) {
      try {
        const user = await mongoose.model('User').findOne({
          email: email.toLowerCase()
        });

        if (user) {
          orderUserId = user._id;
          userIdSource = 'email';
        }
      } catch (error) {
        console.error("Error looking up user by email:", error);
      }
    }



    // Create order with the determined user ID and safeguard toppings
    const processedItems = items.map((item: any) => {
      // Ensure toppings is always an array if present
      let safeToppings: string[] = [];
      if (item.toppings && Array.isArray(item.toppings)) {
        safeToppings = [...item.toppings]; // Make a copy

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
      deliveryType: deliveryType || "pickup",
      items: processedItems, // Use the processed items with safe toppings
      totalAmount: Math.round(finalTotalAmount * 100) / 100,
      status: "pending",
      user: orderUserId,
      cookingInstructions: cookingInstructions || '',
      coupon: {
        isApplied: isCouponApplied,
        code: isCouponApplied ? process.env.COUPON_CODE : undefined,
        discountAmount: Math.round(discountAmount * 100) / 100,
        discountPercentage: isCouponApplied ? activeCouponPercentage : undefined
      },
      createdAt: new Date()
    });

    const savedOrder = await order.save();
    console.log(`📦 NEW ORDER PLACED: #${savedOrder._id} by ${savedOrder.email} - Total: $${savedOrder.totalAmount} (${savedOrder.items?.length || 0} items)`);



    // If order was saved without a user ID but we found one later, update it
    if (!savedOrder.user && orderUserId) {
      try {
        savedOrder.user = new mongoose.Types.ObjectId(orderUserId);
        await savedOrder.save();
      } catch (error) {
        console.error("Error linking order to user:", error);
      }
    }

    // Make sure to explicitly include toppings and size in email data
    const orderItemsForEmail = processedItems.map((item: OrderItem) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      toppings: item.toppings || [],
      size: item.size || undefined
    }));



    // Send email confirmation (non-blocking)
    sendOrderConfirmationEmail({
      id: savedOrder._id.toString(),
      customerName: savedOrder.customerName,
      customerEmail: savedOrder.email,
      phone: savedOrder.phone,
      items: orderItemsForEmail,
      totalAmount: savedOrder.totalAmount,
      coupon: savedOrder.coupon ? {
        isApplied: savedOrder.coupon.isApplied,
        code: savedOrder.coupon.code || undefined,
        discountAmount: savedOrder.coupon.discountAmount,
        discountPercentage: savedOrder.coupon.discountPercentage || undefined
      } : undefined,
      cookingInstructions: typeof savedOrder.cookingInstructions === 'string' ? savedOrder.cookingInstructions : undefined,
      deliveryType: savedOrder.deliveryType || 'pickup',
      address: savedOrder.address || 'Pickup at store'
    }).catch(error => console.error('Failed to send confirmation email:', error));

    // Send notification to admin (non-blocking)
    sendNewOrderNotification(
      savedOrder._id.toString(),
      savedOrder.customerName
    ).catch(error => console.error('Failed to send new order notification:', error));

    return res.status(201).json({
      success: true,
      data: {
        ...savedOrder.toObject(),
        userIdSource
      }
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return res.status(400).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
});

// Update order status (for admin)
router.patch("/:id", adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;



    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }


    return res.json({ success: true, data: order });
  } catch (error: any) {
    console.error("Error updating order:", error); // Debug log
    return res.status(400).json({
      success: false,
      message: "Error updating order",
      error: error.message,
    });
  }
});


export const orderRoutes = router;
