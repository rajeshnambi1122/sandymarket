import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import type { CanaryAuthResponse } from '../types/fuelTypes';

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

            console.log('📊 Fetching fuel inventories from Canary API...');

            const response = await this.axiosInstance.get('/inventories', {
                params: {
                    include: 'inventoryDate,site,tankNumber,productLabel,status,waterHeightInches,fullVolumeGallons,volumeGallons,ullage90PercentGallons,siteLabels',
                },
                headers: {
                    Authorization: `${this.authToken}`,
                },
            });

            console.log(`✅ Successfully fetched ${response.data.length} tank inventories`);
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
