import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import mongoose from "mongoose";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  user?: {
    email: string;
    // ... other user properties
  };
}

export const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("\n=== AUTH MIDDLEWARE ===");
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      console.log("❌ No token provided in authorization header");
      return res.status(401).json({ message: "No auth token" });
    }

    console.log("🔑 Token received:", token.substring(0, 20) + "...");
    console.log("🔍 Using JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set");

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret"
      ) as { userId: string; role: string };

      console.log("✅ Token decoded successfully:", {
        userId: decoded.userId,
        role: decoded.role
      });

      if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
        console.log("❌ Invalid user ID format in token:", decoded.userId);
        return res.status(401).json({ message: "Invalid user ID in token" });
      }

      // Check if user exists
      const user = await User.findById(decoded.userId);
      if (!user) {
        console.log("❌ User not found in database:", decoded.userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log("✅ User found in database:", {
        id: user._id,
        email: user.email,
        role: user.role
      });

      req.userId = decoded.userId;
      req.userRole = user.role || "user";

      next();
    } catch (jwtError) {
      console.error("❌ JWT verification failed:", jwtError);
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

export const adminAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(403).json({ message: "Admin access required" });
  }
};
