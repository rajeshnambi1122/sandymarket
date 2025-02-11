import mongoose from "mongoose";

const gasPriceSchema = new mongoose.Schema({
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

export const GasPrice = mongoose.model("GasPrice", gasPriceSchema);
