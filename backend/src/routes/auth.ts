import express, { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { auth, AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    console.log("REGISTER ENDPOINT CALLED");
    console.log("Request body:", { ...req.body, password: "[REDACTED]" });
    
    const { email, password, name, phone, address } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false,
        message: "Email, password, and name are required" 
      });
    }
    
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid email format" 
      });
    }

    // Check if user already exists
    let existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User with this email already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with normalized email (lowercase)
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone: phone || "",
      address: address || "",
      role: "user", // Default role
    });

    // Save user to database
    const savedUser = await user.save();
    console.log(`User created with ID: ${savedUser._id}`);

    // Create token with user ID and role
    const token = jwt.sign(
      { 
        userId: savedUser._id.toString(), 
        role: savedUser.role 
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1y" }
    );

    // Response without password
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: savedUser._id,
        email: savedUser.email,
        name: savedUser.name,
        phone: savedUser.phone,
        address: savedUser.address,
        role: savedUser.role
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Check for MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "User with this email already exists" 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Registration failed", 
      error: error.message || "Unknown error" 
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN ENDPOINT CALLED");
    console.log("Request body:", { ...req.body, password: "[REDACTED]" });
    
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    // Normalize email to lowercase for consistent matching
    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`Login failed: No user found with email ${normalizedEmail}`);
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Login failed: Invalid password for user ${normalizedEmail}`);
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Create token with user ID and role
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        role: user.role || "user" 
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1y" }
    );

    console.log("User successfully logged in:", {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
    });

    // Associate any existing orders with this user
    try {
      const Order = mongoose.model('Order');
      
      // First try direct email match
      let matchingOrders = await Order.find({ 
        email: normalizedEmail, 
        user: { $exists: false }
      });
      
      if (matchingOrders.length > 0) {
        console.log(`Found ${matchingOrders.length} unlinked orders with exact email match`);
        
        // Update orders with this user's ID
        await Order.updateMany(
          { email: normalizedEmail, user: { $exists: false } },
          { $set: { user: user._id } }
        );
        
        console.log(`Linked ${matchingOrders.length} orders to user ${user._id}`);
      } else {
        // If no exact matches, try case-insensitive email match
        matchingOrders = await Order.find({
          email: { $regex: new RegExp(normalizedEmail, "i") },
          user: { $exists: false }
        });
        
        if (matchingOrders.length > 0) {
          console.log(`Found ${matchingOrders.length} unlinked orders with case-insensitive email match`);
          
          // Update orders with this user's ID
          await Order.updateMany(
            { email: { $regex: new RegExp(normalizedEmail, "i") }, user: { $exists: false } },
            { $set: { user: user._id } }
          );
          
          console.log(`Linked ${matchingOrders.length} orders to user ${user._id}`);
        }
      }
    } catch (orderError) {
      console.error("Error linking orders to user:", orderError);
      // Continue with login process even if order association fails
    }

    // Return user info and token
    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone || "",
        address: user.address || "",
        role: user.role || "user",
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Login failed", 
      error: error.message || "Unknown error" 
    });
  }
});

// Get current user details
router.get("/me", auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// Update FCM token
router.post("/fcm-token", auth, async (req: AuthRequest, res: Response) => {
  try {
    console.log('FCM token update request:', {
      userId: req.user?.userId,
      token: req.body.token ? `${req.body.token.substring(0, 20)}...` : 'missing'
    });

    if (!req.user?.userId) {
      console.log('FCM token update failed: User not authenticated');
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated" 
      });
    }
    const { token } = req.body;
    if (!token) {
      console.log('FCM token update failed: Token missing from request body');
      return res.status(400).json({ 
        success: false,
        message: "FCM token is required" 
      });
    }

    // Update user's FCM token in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        fcmToken: token,
        updatedAt: new Date()
      },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      console.log('FCM token update failed: User not found');
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log('FCM token updated successfully:', {
      userId: updatedUser._id,
      hasToken: !!updatedUser.fcmToken
    });

    return res.json({
      success: true,
      message: "FCM token updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating FCM token:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating FCM token",
      error: error.message
    });
  }
});

export const authRoutes = router;
