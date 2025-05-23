import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
      size: String,
      toppings: {
        type: [String],
        default: []
      }
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "preparing", "ready", "delivered"],
    default: "pending",
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    index: true
  },
  cookingInstructions: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
});

orderSchema.index({ email: 1, user: 1 });

orderSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  
  // Ensure toppings is always an array
  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      if (!item.toppings) {
        item.toppings = [];
      }
    });
  }
  
  next();
});

export const Order = mongoose.model("Order", orderSchema);
