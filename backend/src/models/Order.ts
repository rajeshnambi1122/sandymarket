import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  _id: {
    type: Number,
    default: 1000
  },
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
  address: {
    type: String,
    required: false,
    default: "Pickup"
  },
  deliveryType: {
    type: String,
    enum: ["pickup", "door-delivery"],
    default: "pickup",
    required: false
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
  coupon: {
    isApplied: {
      type: Boolean,
      default: false
    },
    code: {
      type: String,
      required: false
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    discountPercentage: {
      type: Number,
      required: false
    }
  },
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
}, {
  toJSON: {
    transform: function (_doc, ret) {
      // Explicitly order keys
      const ordered = {
        _id: ret._id,
        customerName: ret.customerName,
        phone: ret.phone,
        email: ret.email,
        address: ret.address,
        deliveryType: ret.deliveryType,
        items: ret.items,
        coupon: ret.coupon,
        totalAmount: ret.totalAmount,
        status: ret.status,
        user: ret.user,
        cookingInstructions: ret.cookingInstructions,
        createdAt: ret.createdAt,
        __v: ret.__v,
        id: ret.id
      };
      return ordered;
    }
  }
});

orderSchema.index({ email: 1, user: 1 });

// Custom ID generator to start from 1000
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      // Find the highest order ID
      const highestOrder = await mongoose.model('Order').findOne({}, {}, { sort: { '_id': -1 } });
      // Set the new ID to be the highest + 1, or 1000 if no orders exist
      this._id = highestOrder ? highestOrder._id + 1 : 1000;
    } catch (error) {
      console.error('Error generating order ID:', error);
      // Fallback to 1000 if there's an error
      this._id = 1000;
    }
  }

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
