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
