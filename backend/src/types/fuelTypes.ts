// Fuel monitoring type definitions
export interface TankInventory {
    id: number;
    siteId: number;
    inventoryDate: string;
    volumeGallons: number;
    waterHeightInches: number;
    ullage90PercentGallons: number;
    tankNumber: number;
    productLabel: string;
    fullVolumeGallons: number;
    status: string;
    site: {
        id: number;
        siteName: string;
        nickname: string;
        siteTimezone: string;
        state: string;
        customerId: number;
    };
    siteLabels: any[];
}

export interface FuelNotificationState {
    tankNumber: number;
    productLabel: string;
    status: 'OK' | 'LOW';
    volumeGallons: number;
    lastNotifiedAt?: Date;
}

export interface CanaryAuthResponse {
    accessToken: string;
    userId: number;
    username: string;
    email: string;
    userType: string;
    permissions: any;
}

export interface CanaryLoginRequest {
    username: string;
    password: string;
}

export interface FuelThresholds {
    REGULAR: number;
    PREMIUM: number;
    DIESEL: number;
    'REC FUEL': number;
}

export interface LowFuelAlert {
    tank: TankInventory;
    threshold: number;
    percentageFull: number;
}

export interface TankStatusReportEntry {
    tank: TankInventory;
    threshold: number;
    percentageFull: number;
    ullagePercentGallons: number;
    isLow: boolean;
}

export interface DeliveryEntry {
    startDate: string;       // e.g. "02/27/26"
    startTime: string;       // e.g. "7:55 AM"
    endDate: string;
    endTime: string;
    startVolume: number;     // gallons at start
    endVolume: number;       // gallons at end
    gallonsDelivered: number; // endVolume - startVolume
    startTCVolume: number;   // temperature-corrected
    endTCVolume: number;
    tcGallonsDelivered: number;
    startWaterHeight: number;
    endWaterHeight: number;
    startFuelTemp: number;
    endFuelTemp: number;
    startFuelHeight: number;
    endFuelHeight: number;
}

export interface TankDelivery {
    tankNumber: number;
    productLabel: string;
    deliveries: DeliveryEntry[];
}

export interface DeliveryReportResult {
    reportDate: string;
    tanks: TankDelivery[];
    rawText: string;
}

export interface FuelPriceEntry {
    effectiveDate: string;      // e.g. "03/31/26"
    effectiveTime: string;      // e.g. "18:00"
    product: string;            // e.g. "87 Regular Gasoline E10"
    deliveryLocation: string;   // e.g. "1057 Estey Rd"
    costPerGallon: number;      // cost without taxes
    costWithTaxes: number;      // cost with taxes
}

export interface FuelPriceQuote {
    quoteDate: string;          // quote date extracted from subject/PDF
    supplier: string;           // "RKA Petroleum"
    customerNumber: string;     // e.g. "0003912"
    prices: FuelPriceEntry[];
    rawText: string;            // raw extracted PDF text for debugging
}
