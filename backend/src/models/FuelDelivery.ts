import mongoose from 'mongoose';

/**
 * FuelDelivery model - stores detected fuel deliveries from ATG/Canary
 * Each document represents one delivery event to one tank
 */
const fuelDeliverySchema = new mongoose.Schema({
    tankNumber: { type: Number, required: true },
    productLabel: { type: String, required: true },

    // Delivery window timestamps
    startDate: { type: String, required: true },  // e.g. "02/27/26"
    startTime: { type: String, required: true },  // e.g. "7:55 AM"
    endDate: { type: String, required: true },
    endTime: { type: String, required: true },

    // Volumes (gallons)
    startVolume: { type: Number, required: true },
    endVolume: { type: Number, required: true },
    gallonsDelivered: { type: Number, required: true },

    // Temperature-corrected volumes
    startTCVolume: { type: Number, default: 0 },
    endTCVolume: { type: Number, default: 0 },
    tcGallonsDelivered: { type: Number, default: 0 },

    // Water / temp / height readings
    startWaterHeight: { type: Number, default: 0 },
    endWaterHeight: { type: Number, default: 0 },
    startFuelTemp: { type: Number, default: 0 },
    endFuelTemp: { type: Number, default: 0 },
    startFuelHeight: { type: Number, default: 0 },
    endFuelHeight: { type: Number, default: 0 },

    // When this record was first detected by our system
    detectedAt: { type: Date, default: Date.now },

    // Whether notifications were sent
    notificationSent: { type: Boolean, default: false },
});

// Unique index to prevent duplicate delivery records
fuelDeliverySchema.index(
    { tankNumber: 1, startDate: 1, startTime: 1 },
    { unique: true }
);

export const FuelDelivery = mongoose.model('FuelDelivery', fuelDeliverySchema);
