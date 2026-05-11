import mongoose from 'mongoose';

/**
 * One document per Detroit calendar day: gallons sold that day by product label.
 * Written after the evening tank report is computed.
 */
const fuelDailySalesLineSchema = new mongoose.Schema(
    {
        productLabel: { type: String, required: true },
        gallonsSold: { type: Number, required: true },
    },
    { _id: false }
);

const fuelDailySalesSchema = new mongoose.Schema({
    dateKey: { type: String, required: true }, // MM/DD/YY Detroit
    lines: { type: [fuelDailySalesLineSchema], default: [] },
    recordedAt: { type: Date, default: Date.now },
});

fuelDailySalesSchema.index({ dateKey: 1 }, { unique: true });

export const FuelDailySales = mongoose.model('FuelDailySales', fuelDailySalesSchema);
