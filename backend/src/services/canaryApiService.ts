import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import type { CanaryAuthResponse, DeliveryReportResult, TankDelivery, DeliveryEntry } from '../types/fuelTypes';

dotenv.config();

/**
 * Canary Compliance API Service
 * Handles authentication and API calls to Canary Compliance
 * Automatically refreshes auth token when expired
 */
class CanaryApiService {
    private baseUrl: string;
    private username: string;
    private password: string;
    private authToken: string | null = null;
    private axiosInstance: AxiosInstance;

    constructor() {
        this.baseUrl = process.env.CANARY_API_BASE_URL || 'https://canarycompliance.com/api/v2';
        this.username = process.env.CANARY_API_USERNAME || '';
        this.password = process.env.CANARY_API_PASSWORD || '';

        if (!this.username || !this.password) {
            console.warn('⚠️ Canary API credentials not found in environment variables');
        }

        this.axiosInstance = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Login to Canary Compliance API and get auth token
     */
    async login(): Promise<string> {
        try {
            console.log('🔐 Logging in to Canary Compliance API...');

            const response = await this.axiosInstance.post<CanaryAuthResponse>('/login', {
                username: this.username,
                password: this.password,
            });

            console.log('📋 Login response received');

            if (response.data && response.data.accessToken) {
                this.authToken = response.data.accessToken;
                console.log('✅ Successfully authenticated with Canary API');
                console.log(`👤 User: ${response.data.username} (${response.data.email})`);
                return this.authToken!; // We know it's not null here
            } else {
                console.error('⚠️ Response structure:', response.data);
                throw new Error('No accessToken received from login response');
            }
        } catch (error: any) {
            console.error('❌ Failed to login to Canary API:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            throw new Error(`Canary API login failed: ${error.message}`);
        }
    }

    /**
     * Ensure we have a valid auth token
     */
    private async ensureAuthenticated(): Promise<void> {
        if (!this.authToken) {
            await this.login();
        }
    }

    /**
     * Get fuel tank inventories from Canary API
     * Automatically handles token refresh on authentication errors
     */
    async getInventories(): Promise<any[]> {
        try {
            await this.ensureAuthenticated();

            const response = await this.axiosInstance.get('/inventories', {
                params: {
                    include: 'inventoryDate,site,tankNumber,productLabel,status,waterHeightInches,fullVolumeGallons,volumeGallons,ullage90PercentGallons,siteLabels',
                },
                headers: {
                    Authorization: `${this.authToken}`,
                },
            });

            return response.data;
        } catch (error: any) {
            // Check if error is due to expired/invalid token
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.log('🔄 Auth token expired or invalid, refreshing...');

                // Clear old token and retry with fresh login
                this.authToken = null;
                await this.login();

                // Retry the request with new token
                console.log('🔁 Retrying inventory fetch with new token...');
                const retryResponse = await this.axiosInstance.get('/inventories', {
                    params: {
                        include: 'inventoryDate,site,tankNumber,productLabel,status,waterHeightInches,fullVolumeGallons,volumeGallons,ullage90PercentGallons,siteLabels',
                    },
                    headers: {
                        Authorization: this.authToken, // Canary API uses token directly, not Bearer format
                    },
                });

                console.log(`✅ Successfully fetched ${retryResponse.data.length} tank inventories after token refresh`);
                return retryResponse.data;
            }

            console.error('❌ Failed to fetch inventories:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            throw new Error(`Failed to fetch inventories: ${error.message}`);
        }
    }

    /**
     * Get In-Tank Delivery Report via intent system
     * Step 1: POST /intents with intentName GET_IN_TANK_DELIVERY
     * Step 2: Poll GET /intents/{id} until status is Resolved
     * Step 3: Parse the raw text in event.data and return structured data
     * Retries up to 3 times when intent ends with Failed/Rejected (delays can occur)
     */
    async getDeliveryReport(siteId: number = 5534): Promise<DeliveryReportResult> {
        await this.ensureAuthenticated();

        const maxRetries = 3;

        for (let retry = 1; retry <= maxRetries; retry++) {
            if (retry > 1) {
                const delaySec = retry * 15; // 15s, 30s, 45s between retries
                console.log(`🔄 Retry ${retry}/${maxRetries}: waiting ${delaySec}s before retrying...`);
                await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
            }

            try {
                const result = await this.executeDeliveryIntent(siteId, retry, maxRetries);
                if (result) return result;
            } catch (err: any) {
                console.warn(`⚠️ Attempt ${retry}/${maxRetries} failed: ${err.message}`);
            }
        }

        console.log('ℹ️ All retries exhausted - will check again on next run');
        return { reportDate: new Date().toISOString(), tanks: [], rawText: '' };
    }

    /**
     * Execute a single delivery intent (create + poll). Returns null if Failed/Rejected.
     */
    private async executeDeliveryIntent(siteId: number, retry: number, maxRetries: number): Promise<DeliveryReportResult | null> {
        // Step 1: Create the intent
        console.log(`📋 Creating GET_IN_TANK_DELIVERY intent... (attempt ${retry}/${maxRetries})`);
        let intentId: number;
        try {
            const postRes = await this.axiosInstance.post('/intents', {
                intentName: 'GET_IN_TANK_DELIVERY',
                siteId,
            }, {
                headers: { Authorization: `${this.authToken}` },
            });
            intentId = postRes.data.id;
            console.log(`✅ Intent created: id=${intentId}`);
        } catch (error: any) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                this.authToken = null;
                await this.login();
                const retryRes = await this.axiosInstance.post('/intents', {
                    intentName: 'GET_IN_TANK_DELIVERY',
                    siteId,
                }, { headers: { Authorization: `${this.authToken}` } });
                intentId = retryRes.data.id;
            } else {
                throw new Error(`Failed to create delivery intent: ${error.message}`);
            }
        }

        // Step 2: Poll until Resolved (max 60 seconds)
        console.log(`⏳ Polling intent ${intentId} for resolution...`);
        const maxAttempts = 20;
        const pollInterval = 3000; // 3 seconds
        let rawText = '';

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            const pollRes = await this.axiosInstance.get(`/intents/${intentId}`, {
                params: { include: 'id,status,commandRequests,intentName,siteId' },
                headers: { Authorization: `${this.authToken}` },
            });

            const status: string = pollRes.data.status;
            console.log(`   Attempt ${attempt}/${maxAttempts}: status=${status}`);

            if (status === 'Resolved') {
                const commandRequests: any[] = pollRes.data.commandRequests || [];
                if (commandRequests.length > 0 && commandRequests[0].event?.data) {
                    rawText = commandRequests[0].event.data;
                    console.log(`✅ Delivery report received (${rawText.length} chars)`);
                }
                break;
            }

            if (status === 'Failed' || status === 'Rejected') {
                console.warn(`⚠️ Intent ${intentId} ended with status: ${status}`);
                const commandRequests: any[] = pollRes.data.commandRequests || [];
                if (commandRequests.length > 0) {
                    const errorInfo = commandRequests[0].event?.error || commandRequests[0].event?.message;
                    if (errorInfo) console.log(`📝 Error details: ${errorInfo}`);
                }
                if (retry < maxRetries) {
                    console.log(`🔄 Will retry (${retry}/${maxRetries}) — ATG may be delayed`);
                }
                return null; // Signal to retry
            }
        }

        if (!rawText) {
            console.warn('⚠️ Delivery report did not resolve within the timeout period');
            if (retry < maxRetries) {
                console.log(`🔄 Will retry (${retry}/${maxRetries}) — ATG may need more time`);
            }
            return null;
        }

        return this.parseDeliveryReport(rawText);
    }

    /**
     * Parse the raw ATG delivery report text into structured JSON
     * The report format has blocks per tank with START/END/AMOUNT rows
     */
    private parseDeliveryReport(rawText: string): DeliveryReportResult {
        const tanks: TankDelivery[] = [];
        const lines = rawText.split('\n').map(l => l.trimEnd());

        let currentTank: TankDelivery | null = null;
        let pendingStart: Partial<DeliveryEntry> | null = null;
        let reportDate = new Date().toISOString();

        for (const line of lines) {
            // Match date header like "03/4/2026  4:57 AM"
            const dateHeaderMatch = line.match(/^\s*(\d{2}\/\d+\/\d{4})\s+(\d+:\d+\s+[AP]M)/);
            if (dateHeaderMatch) {
                reportDate = dateHeaderMatch[1] + ' ' + dateHeaderMatch[2];
            }

            // Match tank header like "TANK  1:REGULAR" or "TANK  2:PREMIUM"
            const tankMatch = line.match(/^\s*TANK\s+(\d+)\s*:\s*(.+?)\s*$/);
            if (tankMatch) {
                currentTank = {
                    tankNumber: parseInt(tankMatch[1]),
                    productLabel: tankMatch[2].trim(),
                    deliveries: [],
                };
                tanks.push(currentTank);
                pendingStart = null;
                continue;
            }

            if (!currentTank) continue;

            // Match START row: START: 02/27/26  7:55 AM  809  820  0.00  39.83  13.97
            const startMatch = line.match(
                /^\s*START:\s*(\d{2}\/\d{2}\/\d{2})\s+(\d+:\d+\s+[AP]M)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/
            );
            if (startMatch) {
                pendingStart = {
                    startDate: startMatch[1],
                    startTime: startMatch[2],
                    startVolume: parseFloat(startMatch[3]),
                    startTCVolume: parseFloat(startMatch[4]),
                    startWaterHeight: parseFloat(startMatch[5]),
                    startFuelTemp: parseFloat(startMatch[6]),
                    startFuelHeight: parseFloat(startMatch[7]),
                };
                continue;
            }

            // Match END row: END: 02/27/26  8:13 AM  6718  6848  0.00  32.33  67.24
            const endMatch = line.match(
                /^\s*END:\s*(\d{2}\/\d{2}\/\d{2})\s+(\d+:\d+\s+[AP]M)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/
            );
            if (endMatch && pendingStart) {
                pendingStart.endDate = endMatch[1];
                pendingStart.endTime = endMatch[2];
                pendingStart.endVolume = parseFloat(endMatch[3]);
                pendingStart.endTCVolume = parseFloat(endMatch[4]);
                pendingStart.endWaterHeight = parseFloat(endMatch[5]);
                pendingStart.endFuelTemp = parseFloat(endMatch[6]);
                pendingStart.endFuelHeight = parseFloat(endMatch[7]);
                continue;
            }

            // Match AMOUNT row: AMOUNT:  5909  6028
            const amountMatch = line.match(/^\s*AMOUNT:\s+([\d.]+)\s+([\d.]+)/);
            if (amountMatch && pendingStart && pendingStart.startVolume !== undefined) {
                const entry: DeliveryEntry = {
                    startDate: pendingStart.startDate!,
                    startTime: pendingStart.startTime!,
                    endDate: pendingStart.endDate!,
                    endTime: pendingStart.endTime!,
                    startVolume: pendingStart.startVolume!,
                    endVolume: pendingStart.endVolume!,
                    gallonsDelivered: parseFloat(amountMatch[1]),
                    startTCVolume: pendingStart.startTCVolume!,
                    endTCVolume: pendingStart.endTCVolume!,
                    tcGallonsDelivered: parseFloat(amountMatch[2]),
                    startWaterHeight: pendingStart.startWaterHeight!,
                    endWaterHeight: pendingStart.endWaterHeight || 0,
                    startFuelTemp: pendingStart.startFuelTemp!,
                    endFuelTemp: pendingStart.endFuelTemp || 0,
                    startFuelHeight: pendingStart.startFuelHeight!,
                    endFuelHeight: pendingStart.endFuelHeight || 0,
                };
                currentTank.deliveries.push(entry);
                pendingStart = null;
            }
        }

        return { reportDate, tanks, rawText };
    }

    /**
     * Manually refresh the auth token
     */
    async refreshToken(): Promise<void> {
        console.log('🔄 Manually refreshing auth token...');
        this.authToken = null;
        await this.login();
    }

    /**
     * Get the current auth token (for debugging)
     */
    getAuthToken(): string | null {
        return this.authToken;
    }
}

// Export singleton instance
export const canaryApiService = new CanaryApiService();
