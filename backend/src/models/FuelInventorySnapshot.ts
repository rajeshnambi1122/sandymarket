import mongoose from 'mongoose';

/**
 * Stores per-tank snapshot volumes used for daily sales math.
 * We persist both morning and evening snapshots keyed by Detroit date.
 */
const fuelInventorySnapshotSchema = new mongoose.Schema({
    dateKey: { type: String, required: true }, // MM/DD/YY in Detroit time
    period: { type: String, enum: ['Morning', 'Evening'], required: true },
    tankNumber: { type: Number, required: true },
    productLabel: { type: String, required: true },
    volumeGallons: { type: Number, required: true },
    inventoryDate: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

fuelInventorySnapshotSchema.index(
    { dateKey: 1, period: 1, tankNumber: 1 },
    { unique: true }
);

fuelInventorySnapshotSchema.pre('save', function updateTimestamp(next) {
    this.updatedAt = new Date();
    next();
});

export const FuelInventorySnapshot = mongoose.model('FuelInventorySnapshot', fuelInventorySnapshotSchema);
