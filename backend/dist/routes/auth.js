"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Register
router.post("/register", async (req, res) => {
    try {
        const { email, password, name, phone, address } = req.body;
        // Check if user exists
        let user = await User_1.User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        user = new User_1.User({
            email,
            password: hashedPassword,
            name,
            phone,
            address,
        });
        await user.save();
        // Create token
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                address: user.address,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user exists
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // Check password
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // Create token
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
        console.log("User data:", {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
        });
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                address: user.address,
                role: user.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get current user details
router.get("/me", auth_1.auth, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.authRoutes = router;
