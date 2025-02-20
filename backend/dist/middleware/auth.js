"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const auth = async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "No auth token" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-secret-key");
        // Check if user exists
        const user = await User_1.User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        req.userId = decoded.userId;
        req.userRole = user.role || "user";
        next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        res.status(401).json({ message: "Authentication failed" });
    }
};
exports.auth = auth;
const adminAuth = async (req, res, next) => {
    try {
        if (req.userRole !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }
        next();
    }
    catch (error) {
        res.status(403).json({ message: "Admin access required" });
    }
};
exports.adminAuth = adminAuth;
