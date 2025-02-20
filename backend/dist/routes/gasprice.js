"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gasPriceRoutes = void 0;
const express_1 = __importDefault(require("express"));
const Gasprice_1 = require("../models/Gasprice");
const router = express_1.default.Router();
router.get("/", async (req, res) => {
    try {
        const gasPrices = await Gasprice_1.GasPrice.find();
        res.json(gasPrices);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching gas prices" });
    }
});
exports.gasPriceRoutes = router;
