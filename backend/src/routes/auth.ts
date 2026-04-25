import express, { Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { auth, AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";
import { sendPasswordResetEmail } from "../services/resendEmailService";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {

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
    console.log(`👤 NEW USER REGISTERED: ${savedUser.email} (ID: ${savedUser._id}) - Role: ${savedUser.role}`);

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

      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {

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



    // Associate any existing orders with this user
    try {
      const Order = mongoose.model('Order');

      // First try direct email match
      let matchingOrders = await Order.find({
        email: normalizedEmail,
        user: { $exists: false }
      });

      if (matchingOrders.length > 0) {
        // Update orders with this user's ID
        await Order.updateMany(
          { email: normalizedEmail, user: { $exists: false } },
          { $set: { user: user._id } }
        );

      } else {
        // If no exact matches, try case-insensitive email match
        matchingOrders = await Order.find({
          email: { $regex: new RegExp(normalizedEmail, "i") },
          user: { $exists: false }
        });

        if (matchingOrders.length > 0) {

          // Update orders with this user's ID
          await Order.updateMany(
            { email: { $regex: new RegExp(normalizedEmail, "i") }, user: { $exists: false } },
            { $set: { user: user._id } }
          );

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

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = expiresAt;
      await user.save();

      const frontendBaseUrl =
        process.env.FRONTEND_URL ||
        process.env.CLIENT_URL ||
        process.env.WEBSITE_URL ||
        "https://sandysmarket.net";

      const resetUrl = `${frontendBaseUrl.replace(/\/$/, "")}/?reset-password-token=${encodeURIComponent(rawToken)}`;
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    }

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent."
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process forgot password request",
      error: error.message || "Unknown error"
    });
  }
});

router.get("/reset-password/:token/validate", async (req, res) => {
  try {
    const token = req.params.token;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    return res.status(user ? 200 : 400).json({
      success: Boolean(user),
      message: user ? "Reset token is valid" : "Reset link is invalid or expired"
    });
  } catch (error: any) {
    console.error("Reset token validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate reset token",
      error: error.message || "Unknown error"
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required"
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const hashedToken = crypto.createHash("sha256").update(String(token)).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or expired"
      });
    }

    user.password = await bcrypt.hash(String(password), 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful"
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
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
      fcmToken: user.fcmToken,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// Update FCM token
router.post("/fcm-token", auth, async (req: AuthRequest, res: Response) => {
  try {
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
