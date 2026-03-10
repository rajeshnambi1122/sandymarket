import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';

export interface GasPrice {
    regular: number | null;
    regularUpdated: string | null;
    midgrade: number | null;
    midgradeUpdated: string | null;
    premium: number | null;
    premiumUpdated: string | null;
    diesel: number | null;
    dieselUpdated: string | null;
    stationName: string;
    address: string;
}

export interface PriceComparison {
    sandy: GasPrice;
    bigR: GasPrice;
    timestamp: string;
}

/**
 * Gas Buddy Service
 * Fetches current gas prices for Sandy's Market and Big R
 * Reusable service for both API routes and scheduled alerts
 * Includes retry logic and rate limit handling
 */
class GasBuddyService {
    private readonly sandyUrl = 'https://www.gasbuddy.com/station/68645';
    private readonly bigRUrl = 'https://www.gasbuddy.com/station/68665';

    private readonly headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
    };

    /**
     * Sleep helper for delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch with retry logic and exponential backoff
     */
    private async fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🌐 Fetching ${url} (attempt ${attempt}/${maxRetries})...`);
                
                const response = await axios.get(url, {
                    headers: this.headers,
                    timeout: 15000,
                });

                return response.data;
            } catch (error: any) {
                lastError = error;
                const axiosError = error as AxiosError;

                if (axiosError.response?.status === 429) {
                    // Rate limited - wait longer
                    const waitTime = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30s
                    console.log(`⏳ Rate limited (429). Waiting ${waitTime}ms before retry...`);
                    await this.sleep(waitTime);
                } else if (attempt < maxRetries) {
                    // Other error - shorter wait
                    const waitTime = 1000 * attempt;
                    console.log(`⚠️ Error: ${error.message}. Retrying in ${waitTime}ms...`);
                    await this.sleep(waitTime);
                } else {
                    console.error(`❌ Failed after ${maxRetries} attempts:`, error.message);
                }
            }
        }

        throw lastError || new Error('Failed to fetch data from GasBuddy');
    }

    /**
     * Fetch Sandy's Market gas prices
     */
    async getSandyPrices(): Promise<GasPrice> {
        try {
            const data = await this.fetchWithRetry(this.sandyUrl);
            const $ = cheerio.load(data);
            const bodyText = $('body').text();

            const prices: GasPrice = {
                regular: null,
                regularUpdated: null,
                midgrade: null,
                midgradeUpdated: null,
                premium: null,
                premiumUpdated: null,
                diesel: null,
                dieselUpdated: null,
                stationName: 'Sandy\'s Market',
                address: '1057 Estey Rd, Beaverton, MI',
            };

            const stationPricesIndex = bodyText.indexOf('Station Prices');
            const stationRatingsIndex = bodyText.indexOf('Station Ratings');

            if (stationPricesIndex !== -1 && stationRatingsIndex !== -1) {
                const sectionText = bodyText.substring(stationPricesIndex, stationRatingsIndex);
                                
                // Match price with time, but DON'T cross over another price ($)
                // Use [^$] to stop at the next price
                const hourMatches = [...sectionText.matchAll(/\$(\d+\.\d+)([^$]{0,80}?)([1-9]|1\d|2[0-4])\s(Hour)s?\sAgo/gi)];
                const dayMatches = [...sectionText.matchAll(/\$(\d+\.\d+)([^$]{0,80}?)([1-9]|[12]\d|30)\s(Day)s?\sAgo/gi)];
                const minuteMatches = [...sectionText.matchAll(/\$(\d+\.\d+)([^$]{0,80}?)([1-9]|[1-5]\d)\s(Minute)s?\sAgo/gi)];
                
                // Normalize matches to have same structure: [fullMatch, price, time, unit, index]
                const normalizeMatch = (match: RegExpMatchArray, unit: string) => {
                    return {
                        fullMatch: match[0],
                        price: match[1],
                        time: match[3],
                        unit: unit,
                        index: match.index || 0
                    };
                };
                
                // Combine and sort by position in text
                const allMatches = [
                    ...hourMatches.map(m => normalizeMatch(m, 'Hour')),
                    ...dayMatches.map(m => normalizeMatch(m, 'Day')),
                    ...minuteMatches.map(m => normalizeMatch(m, 'Minute'))
                ].sort((a, b) => a.index - b.index);
                
                // Convert back to array format for existing logic
                const priceTimeMatches = allMatches.map(m => [m.fullMatch, m.price, m.time, m.unit]);

                console.log(`📊 Sandy's - Found ${priceTimeMatches.length} price+time matches (${hourMatches.length} hours, ${dayMatches.length} days, ${minuteMatches.length} minutes)`);
                if (priceTimeMatches.length > 0) {
                    console.log(`   First match: $${priceTimeMatches[0][1]} - ${priceTimeMatches[0][2]} ${priceTimeMatches[0][3]}s Ago`);
                }

                // For Sandy's Market: Usually 2 prices (Regular, Diesel)
                // Sometimes 3 if Midgrade is available
                if (priceTimeMatches.length === 2) {
                    // 2 prices: Regular and Diesel (no Midgrade)
                    const [, regularPrice, regularTimeNum, regularTimeUnit] = priceTimeMatches[0];
                    prices.regular = parseFloat(regularPrice);
                    prices.regularUpdated = `${regularTimeNum} ${regularTimeUnit}${regularTimeNum !== '1' ? 's' : ''} Ago`;

                    const [, dieselPrice, dieselTimeNum, dieselTimeUnit] = priceTimeMatches[1];
                    prices.diesel = parseFloat(dieselPrice);
                    prices.dieselUpdated = `${dieselTimeNum} ${dieselTimeUnit}${dieselTimeNum !== '1' ? 's' : ''} Ago`;
                } else if (priceTimeMatches.length === 3) {
                    // 3 prices: Regular, Midgrade, Diesel
                    const [, regularPrice, regularTimeNum, regularTimeUnit] = priceTimeMatches[0];
                    prices.regular = parseFloat(regularPrice);
                    prices.regularUpdated = `${regularTimeNum} ${regularTimeUnit}${regularTimeNum !== '1' ? 's' : ''} Ago`;

                    const [, midgradePrice, midgradeTimeNum, midgradeTimeUnit] = priceTimeMatches[1];
                    prices.midgrade = parseFloat(midgradePrice);
                    prices.midgradeUpdated = `${midgradeTimeNum} ${midgradeTimeUnit}${midgradeTimeNum !== '1' ? 's' : ''} Ago`;

                    const [, dieselPrice, dieselTimeNum, dieselTimeUnit] = priceTimeMatches[2];
                    prices.diesel = parseFloat(dieselPrice);
                    prices.dieselUpdated = `${dieselTimeNum} ${dieselTimeUnit}${dieselTimeNum !== '1' ? 's' : ''} Ago`;
                } else {
                    console.log(`   ⚠️ Unexpected number of prices (${priceTimeMatches.length}), using fallback logic`);
                }
            }

            console.log('✅ Sandy\'s fuel prices fetched successfully');
            return prices;
        } catch (error: any) {
            console.error('❌ Failed to fetch Sandy\'s prices:', error.message);
            throw error;
        }
    }

    /**
     * Fetch Big R's Pump and Party gas prices
     */
    async getBigRPrices(): Promise<GasPrice> {
        try {
            const data = await this.fetchWithRetry(this.bigRUrl);
            const $ = cheerio.load(data);
            const bodyText = $('body').text();

            const prices: GasPrice = {
                regular: null,
                regularUpdated: null,
                midgrade: null,
                midgradeUpdated: null,
                premium: null,
                premiumUpdated: null,
                diesel: null,
                dieselUpdated: null,
                stationName: 'Big R\'s Pump and Party',
                address: '4016 S MI-30, Beaverton, MI',
            };

            const stationPricesIndex = bodyText.indexOf('Station Prices');
            const stationRatingsIndex = bodyText.indexOf('Station Ratings');

            if (stationPricesIndex !== -1 && stationRatingsIndex !== -1) {
                const sectionText = bodyText.substring(stationPricesIndex, stationRatingsIndex);
                              
                // Match price with time, but DON'T cross over another price ($)
                const hourMatches = [...sectionText.matchAll(/\$(\d+\.\d+)([^$]{0,80}?)([1-9]|1\d|2[0-4])\s(Hour)s?\sAgo/gi)];
                const dayMatches = [...sectionText.matchAll(/\$(\d+\.\d+)([^$]{0,80}?)([1-9]|[12]\d|30)\s(Day)s?\sAgo/gi)];
                const minuteMatches = [...sectionText.matchAll(/\$(\d+\.\d+)([^$]{0,80}?)([1-9]|[1-5]\d)\s(Minute)s?\sAgo/gi)];
                
                // Normalize and sort by position in text
                const normalizeMatch = (match: RegExpMatchArray) => ({
                    fullMatch: match[0],
                    price: match[1],
                    time: match[3],
                    unit: match[4],
                    index: match.index || 0
                });
                
                const allMatches = [
                    ...hourMatches.map(normalizeMatch),
                    ...dayMatches.map(normalizeMatch),
                    ...minuteMatches.map(normalizeMatch)
                ].sort((a, b) => a.index - b.index);
                
                const priceTimeMatches = allMatches.map(m => [m.fullMatch, m.price, m.time, m.unit]);

                console.log(`📊 Big R - Found ${priceTimeMatches.length} price+time matches`);
                if (priceTimeMatches.length > 0) {
                    console.log(`   First match: $${priceTimeMatches[0][1]} - ${priceTimeMatches[0][2]} ${priceTimeMatches[0][3]}s Ago`);
                }

                const hasRegular = sectionText.includes('Regular');
                const hasDiesel = sectionText.includes('Diesel');
                const hasMidgrade = sectionText.includes('Midgrade');
                const hasPremium = sectionText.includes('Premium');
                
                console.log(`   Fuel types detected: Regular=${hasRegular}, Midgrade=${hasMidgrade}, Premium=${hasPremium}, Diesel=${hasDiesel}`);

                if (priceTimeMatches.length >= 1 && hasRegular) {
                    const [, price, timeNum, timeUnit] = priceTimeMatches[0];
                    prices.regular = parseFloat(price);
                    prices.regularUpdated = `${timeNum} ${timeUnit}${timeNum !== '1' ? 's' : ''} Ago`;
                }

                if (priceTimeMatches.length >= 2 && hasDiesel) {
                    const [, price, timeNum, timeUnit] = priceTimeMatches[1];
                    prices.diesel = parseFloat(price);
                    prices.dieselUpdated = `${timeNum} ${timeUnit}${timeNum !== '1' ? 's' : ''} Ago`;
                }

                if (priceTimeMatches.length >= 3 && hasMidgrade) {
                    const [, price, timeNum, timeUnit] = priceTimeMatches[1];
                    prices.midgrade = parseFloat(price);
                    prices.midgradeUpdated = `${timeNum} ${timeUnit}${timeNum !== '1' ? 's' : ''} Ago`;

                    if (priceTimeMatches.length >= 3 && hasDiesel) {
                        const [, dieselPrice, dieselTimeNum, dieselTimeUnit] = priceTimeMatches[2];
                        prices.diesel = parseFloat(dieselPrice);
                        prices.dieselUpdated = `${dieselTimeNum} ${dieselTimeUnit}${dieselTimeNum !== '1' ? 's' : ''} Ago`;
                    }
                }

                if (priceTimeMatches.length >= 4 && hasPremium) {
                    const premiumIndex = hasMidgrade ? 2 : 1;
                    if (priceTimeMatches[premiumIndex]) {
                        const [, price, timeNum, timeUnit] = priceTimeMatches[premiumIndex];
                        prices.premium = parseFloat(price);
                        prices.premiumUpdated = `${timeNum} ${timeUnit}${timeNum !== '1' ? 's' : ''} Ago`;
                    }
                }
            }

            console.log('✅ Big R fuel prices fetched successfully');
            return prices;
        } catch (error: any) {
            console.error('❌ Failed to fetch Big R prices:', error.message);
            throw error;
        }
    }

    /**
     * Fetch and compare prices from both stations
     * Fetches sequentially with delay to avoid rate limiting
     */
    async comparePrices(): Promise<PriceComparison> {
        try {
            console.log('\n💰 ========== FETCHING GAS BUDDY PRICES ==========');

            // Fetch Sandy's first
            const sandy = await this.getSandyPrices();
            
            // Wait 2 seconds before fetching Big R to avoid rate limiting
            console.log('⏳ Waiting 2 seconds before next request...');
            await this.sleep(2000);
            
            // Fetch Big R
            const bigR = await this.getBigRPrices();

            const comparison: PriceComparison = {
                sandy,
                bigR,
                timestamp: new Date().toISOString(),
                
            };

            console.log('✅ ========== PRICE COMPARISON COMPLETED ==========\n');
            return comparison;
        } catch (error: any) {
            console.error('❌ Failed to compare prices:', error.message);
            throw error;
        }
    }
}

export const gasBuddyService = new GasBuddyService();
