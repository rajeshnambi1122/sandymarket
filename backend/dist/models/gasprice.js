"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasPrice = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const gasPriceSchema = new mongoose_1.default.Schema({
    type: {
        type: String,
        required: true,
    },
    price: {
        type: String,
        required: true,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});
exports.GasPrice = mongoose_1.default.model("GasPrice", gasPriceSchema);
