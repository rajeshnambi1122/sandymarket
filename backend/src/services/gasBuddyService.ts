import axios, { AxiosError, AxiosResponse } from 'axios';
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

const GET_STATION_PRICES_QUERY = `
query GetStationPrices($id: ID!) {
  station(id: $id) {
    id
    prices {
      fuelProduct
      longName
      cash {
        nickname
        postedTime
        price
        formattedPrice
      }
      credit {
        nickname
        postedTime
        price
        formattedPrice
      }
    }
  }
}`;

type PriceKey = 'regular' | 'midgrade' | 'premium' | 'diesel';

interface GbPriceSlot {
    nickname?: string | null;
    postedTime?: string | null;
    price?: number | null;
    formattedPrice?: string | null;
}

interface GbPriceRow {
    fuelProduct: string;
    longName?: string | null;
    cash?: GbPriceSlot | null;
    credit?: GbPriceSlot | null;
}

class GasBuddyService {
    private readonly homepageUrl = 'https://www.gasbuddy.com/';
    private readonly sandyUrl = 'https://www.gasbuddy.com/station/68645';
    private readonly bigRUrl = 'https://www.gasbuddy.com/station/68665';
    private readonly graphqlUrl = 'https://www.gasbuddy.com/graphql';

    private readonly headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ta;q=0.8,zh-CN;q=0.7,zh;q=0.6',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
    };

    private readonly jsonHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,ta;q=0.8,zh-CN;q=0.7,zh;q=0.6',
        'Content-Type': 'application/json',
        'Origin': 'https://www.gasbuddy.com',
        'Apollo-Require-Preflight': 'true',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
    };

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private normalizeCookies(setCookie: string | string[] | undefined): string {
        if (!setCookie) return '';
        const parts = Array.isArray(setCookie) ? setCookie : [setCookie];
        return parts
            .map((cookie) => cookie.split(';')[0].trim())
            .filter(Boolean)
            .join('; ');
    }

    private mergeCookies(base: string, override: string): string {
        const merged = new Map<string, string>();

        const apply = (cookieString: string) => {
            cookieString
                .split(';')
                .map((part) => part.trim())
                .filter(Boolean)
                .forEach((part) => {
                    const separatorIndex = part.indexOf('=');
                    if (separatorIndex <= 0) return;

                    const key = part.slice(0, separatorIndex).trim();
                    const value = part.slice(separatorIndex + 1).trim();
                    if (!key) return;

                    merged.set(key, value);
                });
        };

        apply(base);
        apply(override);

        return Array.from(merged.entries())
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
    }

    private extractStationId(pageUrl: string): string | null {
        const match = pageUrl.match(/\/station\/(\d+)/);
        return match ? match[1] : null;
    }

    private extractGbcsrf(html: string): string | null {
        const match = html.match(/window\.gbcsrf\s*=\s*"([^"]+)"/);
        return match ? match[1] : null;
    }

    private fuelProductToKey(fuelProduct: string, longName?: string | null): PriceKey | null {
        const fuelProductLower = fuelProduct.toLowerCase();
        const longNameLower = (longName || '').toLowerCase();
        const combined = `${fuelProductLower} ${longNameLower}`;

        if (
            fuelProductLower.includes('regular') ||
            longNameLower.includes('regular') ||
            combined.includes('unleaded') ||
            combined.includes('unl')
        ) {
            return 'regular';
        }
        if (
            fuelProductLower.includes('midgrade') ||
            fuelProductLower.includes('mid_grade') ||
            longNameLower.includes('midgrade') ||
            combined.includes('plus')
        ) {
            return 'midgrade';
        }
        if (
            fuelProductLower.includes('premium') ||
            longNameLower.includes('premium') ||
            combined.includes('super')
        ) {
            return 'premium';
        }
        if (fuelProductLower.includes('diesel') || longNameLower.includes('diesel')) return 'diesel';

        return null;
    }

    private pickSlot(row: GbPriceRow): GbPriceSlot | null {
        if (row.credit?.price != null && !Number.isNaN(Number(row.credit.price))) return row.credit;
        if (row.cash?.price != null && !Number.isNaN(Number(row.cash.price))) return row.cash;
        return null;
    }

    private formatPostedTime(iso: string | null | undefined): string | null {
        if (!iso) return null;

        try {
            const timestamp = new Date(iso);
            if (Number.isNaN(timestamp.getTime())) return iso;

            const diffMs = Date.now() - timestamp.getTime();
            const mins = Math.floor(diffMs / 60000);

            if (mins < 1) return 'Just now';
            if (mins < 60) return `${mins} Minute${mins !== 1 ? 's' : ''} Ago`;

            const hours = Math.floor(mins / 60);
            if (hours < 48) return `${hours} Hour${hours !== 1 ? 's' : ''} Ago`;

            const days = Math.floor(hours / 24);
            return `${days} Day${days !== 1 ? 's' : ''} Ago`;
        } catch {
            return iso;
        }
    }

    private isReasonableGasPrice(value: number): boolean {
        return value >= 0.5 && value <= 15.0;
    }

    private setGradePrice(prices: GasPrice, key: PriceKey, value: number, updated: string | null): void {
        const mutablePrices = prices as unknown as Record<string, number | string | null>;
        mutablePrices[key] = value;
        mutablePrices[`${key}Updated`] = updated;
    }

    private applyGraphqlRows(rows: GbPriceRow[], prices: GasPrice): void {
        for (const row of rows) {
            const key = this.fuelProductToKey(row.fuelProduct, row.longName);
            if (!key) continue;

            const slot = this.pickSlot(row);
            if (!slot || slot.price == null) continue;

            const value = Number(slot.price);
            if (!this.isReasonableGasPrice(value)) continue;

            this.setGradePrice(prices, key, value, this.formatPostedTime(slot.postedTime));
        }
    }

    private async fetchWithRetry(
        url: string,
        maxRetries = 3,
        headers: Record<string, string> = this.headers
    ): Promise<AxiosResponse<string>> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Fetching ${url} (attempt ${attempt}/${maxRetries})...`);
                return await axios.get<string>(url, {
                    headers,
                    timeout: 20000,
                    responseType: 'text',
                });
            } catch (error: unknown) {
                lastError = error instanceof Error ? error : new Error(String(error));
                const axiosError = error as AxiosError;

                if (axiosError.response?.status === 429) {
                    const waitTime = Math.min(1000 * Math.pow(2, attempt), 30000);
                    console.log(`Rate limited (429). Waiting ${waitTime}ms before retry...`);
                    await this.sleep(waitTime);
                } else if (attempt < maxRetries) {
                    const waitTime = 1000 * attempt;
                    console.log(`Request error: ${lastError.message}. Retrying in ${waitTime}ms...`);
                    await this.sleep(waitTime);
                } else {
                    console.error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
                }
            }
        }

        throw lastError || new Error('Failed to fetch data from GasBuddy');
    }

    private async fetchPricesGraphql(
        stationPageUrl: string,
        stationId: string,
        cookies: string,
        csrf: string | null
    ): Promise<GbPriceRow[] | null> {
        try {
            const body = {
                operationName: 'GetStationPrices',
                query: GET_STATION_PRICES_QUERY,
                variables: { id: stationId },
            };

            const response = await axios.post<{ data?: { station?: { prices?: GbPriceRow[] } }; errors?: unknown }>(
                this.graphqlUrl,
                body,
                {
                    headers: {
                        ...this.jsonHeaders,
                        'Referer': stationPageUrl,
                        ...(csrf ? { gbcsrf: csrf } : {}),
                        ...(cookies ? { Cookie: cookies } : {}),
                    },
                    timeout: 20000,
                    validateStatus: (status) => status < 500,
                }
            );

            if (response.status !== 200) {
                console.warn(`GasBuddy GraphQL returned HTTP ${response.status}. Falling back to HTML parsing.`);
                return null;
            }

            if (response.data?.errors) {
                console.warn(`GasBuddy GraphQL returned errors: ${JSON.stringify(response.data.errors).slice(0, 500)}`);
            }

            const rows = response.data?.data?.station?.prices;
            if (!rows || !Array.isArray(rows) || rows.length === 0) return null;

            return rows;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`GasBuddy GraphQL request failed: ${message}`);
            return null;
        }
    }

    private extractPricesFromGasPriceGrid($: ReturnType<typeof cheerio.load>, prices: GasPrice): void {
        const container = $('[class*="GasPriceCollection-module__collectionContainer"]').first();
        if (!container.length) return;

        const rows = container.children('[class*="GasPriceCollection-module__row"]');
        if (rows.length < 2) return;

        const labelTexts = $(rows[0])
            .find('[class*="fuelTypeDisplay"]')
            .toArray()
            .map((element) => $(element).text().trim().toLowerCase());

        const priceCells = $(rows[1])
            .find('[class*="priceDisplay"], [class*="FuelTypePriceDisplay"]')
            .toArray();

        const labelToKey = (label: string): PriceKey | null => {
            if (label.includes('regular')) return 'regular';
            if (label.includes('midgrade') || label.includes('mid-grade') || label.includes('mid grade')) return 'midgrade';
            if (label.includes('premium')) return 'premium';
            if (label.includes('diesel')) return 'diesel';
            return null;
        };

        for (let index = 0; index < Math.min(labelTexts.length, priceCells.length); index++) {
            const key = labelToKey(labelTexts[index]);
            if (!key || prices[key] != null) continue;

            const cell = $(priceCells[index]);
            if (cell.find('[class*="loader"]').length) continue;

            const text = cell.text();
            const priceMatch = text.match(/\$?(\d+\.\d{2})/);
            if (!priceMatch) continue;

            const value = parseFloat(priceMatch[1]);
            if (!this.isReasonableGasPrice(value)) continue;

            const timeMatch = text.match(/(\d+)\s*(h|m|d)\w*\s*ago/i);
            let timeFound: string | null = null;

            if (timeMatch) {
                const num = timeMatch[1];
                const unit = timeMatch[2].toLowerCase();
                const label = unit === 'h' ? 'Hour' : unit === 'm' ? 'Minute' : 'Day';
                timeFound = `${num} ${label}${num !== '1' ? 's' : ''} Ago`;
            }

            this.setGradePrice(prices, key, value, timeFound);
        }
    }

    private extractPricesFromStationText(html: string, prices: GasPrice): void {
        const $ = cheerio.load(html);
        const bodyText = $('body')
            .text()
            .replace(/\s+/g, ' ')
            .trim();

        if (!bodyText) return;

        const stationPricesIndex = bodyText.indexOf('Station Prices');
        if (stationPricesIndex === -1) return;

        const sectionEndCandidates = [
            bodyText.indexOf('Station Ratings', stationPricesIndex),
            bodyText.indexOf('Features & Amenities', stationPricesIndex),
            bodyText.indexOf('Report Prices', stationPricesIndex),
        ].filter((index) => index !== -1);

        const sectionEndIndex = sectionEndCandidates.length > 0
            ? Math.min(...sectionEndCandidates)
            : Math.min(bodyText.length, stationPricesIndex + 2000);

        const sectionText = bodyText.slice(stationPricesIndex, sectionEndIndex);
        if (!sectionText) return;

        const labelMatches = [...sectionText.matchAll(/\b(regular|mid[\s-]?grade|premium|diesel|plus|super|unleaded)\b/gi)];
        const labels: PriceKey[] = [];

        const labelToKey = (label: string): PriceKey | null => {
            const normalized = label.toLowerCase();
            if (normalized.includes('regular') || normalized.includes('unleaded')) return 'regular';
            if (normalized.includes('mid') || normalized === 'plus') return 'midgrade';
            if (normalized.includes('premium') || normalized === 'super') return 'premium';
            if (normalized.includes('diesel')) return 'diesel';
            return null;
        };

        for (const match of labelMatches) {
            const key = labelToKey(match[1]);
            if (!key) continue;
            if (labels[labels.length - 1] === key) continue;
            labels.push(key);
        }

        const priceMatches = [
            ...sectionText.matchAll(/\$(\d+\.\d+)([^$]{0,120}?)(\d+)\s+(Minute|Hour|Day)s?\s+Ago/gi),
        ].map((match) => ({
            price: parseFloat(match[1]),
            updated: `${match[3]} ${match[4]}${match[3] !== '1' ? 's' : ''} Ago`,
        }));

        if (labels.length === 0 || priceMatches.length === 0) return;

        let priceIndex = 0;
        for (const key of labels) {
            if (priceIndex >= priceMatches.length) break;
            if (prices[key] != null) {
                priceIndex++;
                continue;
            }

            const match = priceMatches[priceIndex];
            if (this.isReasonableGasPrice(match.price)) {
                this.setGradePrice(prices, key, match.price, match.updated);
            }
            priceIndex++;
        }
    }

    private extractPricesFromHtml(html: string, prices: GasPrice): void {
        const $ = cheerio.load(html);

        this.extractPricesFromGasPriceGrid($, prices);
        this.extractPricesFromStationText(html, prices);

        $('script, style, noscript, svg, img, iframe').remove();

        const allElements = $('*').toArray();

        for (let index = 0; index < allElements.length; index++) {
            const element = $(allElements[index]);
            const textRaw = element.text().trim();
            if (!textRaw || textRaw.length > 50) continue;

            const text = textRaw.toLowerCase();
            let key: PriceKey | null = null;

            if (text === 'regular' || text === 'unleaded' || text === 'regular gas') key = 'regular';
            else if (text === 'midgrade' || text === 'mid_grade' || text === 'midgrade gas' || text === 'plus') key = 'midgrade';
            else if (text === 'premium' || text === 'premium gas' || text === 'super') key = 'premium';
            else if (text === 'diesel') key = 'diesel';

            if (key && prices[key] == null) {
                for (let nextIndex = index + 1; nextIndex < Math.min(index + 50, allElements.length); nextIndex++) {
                    const nextElement = $(allElements[nextIndex]);
                    const nextText = nextElement.text().trim();
                    if (!nextText || nextText.length > 80) continue;

                    const priceMatch = nextText.match(/\$?(\d+\.\d{2})/);
                    if (priceMatch && prices[key] == null) {
                        const value = parseFloat(priceMatch[1]);
                        if (!this.isReasonableGasPrice(value)) continue;

                        let timeFound: string | null = null;

                        for (let timeIndex = nextIndex + 1; timeIndex < Math.min(nextIndex + 30, allElements.length); timeIndex++) {
                            const timeElement = $(allElements[timeIndex]);
                            const timeText = timeElement.text().trim();
                            if (!timeText || timeText.length > 50) continue;

                            const timeMatch = timeText.match(/(\d+)\s*(h|m|d)\w*\s*ago/i);
                            if (!timeMatch) continue;

                            const num = timeMatch[1];
                            const unit = timeMatch[2].toLowerCase();
                            const label = unit === 'h' ? 'Hour' : unit === 'm' ? 'Minute' : 'Day';
                            timeFound = `${num} ${label}${num !== '1' ? 's' : ''} Ago`;
                            break;
                        }

                        this.setGradePrice(prices, key, value, timeFound);
                        break;
                    }
                }
            }
        }
    }

    private async loadPricesForStationPage(pageUrl: string, prices: GasPrice): Promise<void> {
        const stationId = this.extractStationId(pageUrl);

        const homepageResponse = await this.fetchWithRetry(this.homepageUrl);
        const homepageCookies = this.normalizeCookies(homepageResponse.headers['set-cookie']);

        const warmupDelayMs = 500 + Math.floor(Math.random() * 501);
        console.log(`Waiting ${warmupDelayMs}ms before station page request...`);
        await this.sleep(warmupDelayMs);

        const stationHeaders: Record<string, string> = {
            ...this.headers,
            'Referer': this.homepageUrl,
            ...(homepageCookies ? { Cookie: homepageCookies } : {}),
        };

        const stationResponse = await this.fetchWithRetry(pageUrl, 3, stationHeaders);
        const stationHtml = stationResponse.data;
        const stationCookies = this.normalizeCookies(stationResponse.headers['set-cookie']);
        const mergedCookies = this.mergeCookies(homepageCookies, stationCookies);
        const csrf = this.extractGbcsrf(stationHtml);

        if (stationId) {
            const rows = await this.fetchPricesGraphql(pageUrl, stationId, mergedCookies, csrf);
            if (rows) this.applyGraphqlRows(rows, prices);
        }

        this.extractPricesFromHtml(stationHtml, prices);
    }

    async getSandyPrices(): Promise<GasPrice> {
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

        try {
            console.log('\nFetching Sandy\'s Market (GraphQL + HTML fallback)...');
            await this.loadPricesForStationPage(this.sandyUrl, prices);
            console.log(`Sandy's fuel prices: Reg $${prices.regular ?? '-'}, Diesel $${prices.diesel ?? '-'}`);
            return prices;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Failed to fetch Sandy's prices: ${message}`);
            throw new Error('Failed to fetch data');
        }
    }

    async getBigRPrices(): Promise<GasPrice> {
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

        try {
            console.log('\nFetching Big R (GraphQL + HTML fallback)...');
            await this.loadPricesForStationPage(this.bigRUrl, prices);
            console.log(`Big R fuel prices: Reg $${prices.regular ?? '-'}, Diesel $${prices.diesel ?? '-'}`);
            return prices;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Failed to fetch Big R prices: ${message}`);
            throw error;
        }
    }

    async comparePrices(): Promise<PriceComparison> {
        try {
            console.log('\n========== FETCHING GAS BUDDY PRICES ==========');

            const sandy = await this.getSandyPrices();
            console.log('Waiting 2 seconds before next request...');
            await this.sleep(2000);
            const bigR = await this.getBigRPrices();

            console.log('========== PRICE COMPARISON COMPLETED ==========\n');
            return {
                sandy,
                bigR,
                timestamp: new Date().toISOString(),
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Failed to compare prices: ${message}`);
            throw error;
        }
    }
}

export const gasBuddyService = new GasBuddyService();
