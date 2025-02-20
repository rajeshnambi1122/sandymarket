"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const orders_1 = require("./routes/orders");
const auth_1 = require("./routes/auth");
const gasprice_1 = require("./routes/gasprice");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: "http://localhost:8080", // Your frontend URL
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use("/api/orders", orders_1.orderRoutes);
app.use("/api/auth", auth_1.authRoutes);
app.use("/api/gasprice", gasprice_1.gasPriceRoutes);
// MongoDB connection options
const mongooseOptions = {
    retryWrites: true,
    w: "majority",
};
// MongoDB connection
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit if cannot connect to database
});
// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection:", error);
    process.exit(1);
});
