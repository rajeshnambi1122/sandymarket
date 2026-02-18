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
