import * as msal from '@azure/msal-node';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import dotenv from 'dotenv';
import { FuelPriceQuote, FuelPriceEntry } from '../types/fuelTypes';

dotenv.config();

/**
 * Outlook Email Service
 * Reads fuel price quote emails from a personal Hotmail account
 * using Microsoft Graph API with Device Code Flow (OAuth2).
 *
 * First run: prints a URL + code to the console for one-time interactive login.
 * Subsequent runs: uses the cached refresh token for unattended access.
 */

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const TOKEN_CACHE_PATH = path.resolve(__dirname, '../../.msal-token-cache.json');

// MSAL configuration for personal Microsoft accounts
const msalConfig: msal.Configuration = {
    auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID || '',
        authority: 'https://login.microsoftonline.com/consumers', // personal accounts
    },
    cache: {
        cachePlugin: {
            beforeCacheAccess: async (cacheContext: msal.TokenCacheContext) => {
                try {
                    if (fs.existsSync(TOKEN_CACHE_PATH)) {
                        const data = fs.readFileSync(TOKEN_CACHE_PATH, 'utf-8');
                        cacheContext.tokenCache.deserialize(data);
                    }
                } catch (err) {
                    console.warn('⚠️ Could not read MSAL token cache:', (err as Error).message);
                }
            },
            afterCacheAccess: async (cacheContext: msal.TokenCacheContext) => {
                if (cacheContext.cacheHasChanged) {
                    try {
                        fs.writeFileSync(TOKEN_CACHE_PATH, cacheContext.tokenCache.serialize());
                    } catch (err) {
                        console.warn('⚠️ Could not write MSAL token cache:', (err as Error).message);
                    }
                }
            },
        },
    },
};

class OutlookEmailService {
    private pca: msal.PublicClientApplication;
    private initialized: boolean = false;

    constructor() {
        this.pca = new msal.PublicClientApplication(msalConfig);
    }

    /**
     * Get an access token. Tries silent (cached) first, falls back to device code flow.
     */
    private async getAccessToken(): Promise<string> {
        const scopes = ['Mail.Read', 'Mail.ReadBasic'];

        // Try silent acquisition first (using cached refresh token)
        const accounts = await this.pca.getTokenCache().getAllAccounts();
        if (accounts.length > 0) {
            try {
                const silentResult = await this.pca.acquireTokenSilent({
                    account: accounts[0],
                    scopes,
                });
                if (silentResult?.accessToken) {
                    if (!this.initialized) {
                        console.log('✅ Outlook: Authenticated silently (cached token)');
                        this.initialized = true;
                    }
                    return silentResult.accessToken;
                }
            } catch (err) {
                console.log('🔄 Outlook: Silent token acquisition failed, will use device code flow');
            }
        }

        // Fall back to device code flow (interactive, one-time)
        console.log('\n' + '='.repeat(60));
        console.log('📧 OUTLOOK EMAIL AUTHENTICATION REQUIRED');
        console.log('='.repeat(60));

        const deviceCodeResult = await this.pca.acquireTokenByDeviceCode({
            scopes,
            deviceCodeCallback: (response) => {
                console.log('\n🔗 To sign in to sandymarket-gbs@hotmail.com:');
                console.log(`   1. Open: ${response.verificationUri}`);
                console.log(`   2. Enter code: ${response.userCode}`);
                console.log(`   3. Sign in with your Hotmail account\n`);
                console.log(`⏳ Waiting for you to complete sign-in...`);
            },
        });

        if (!deviceCodeResult?.accessToken) {
            throw new Error('Failed to acquire access token via device code flow');
        }

        console.log('✅ Outlook: Successfully authenticated!');
        console.log('='.repeat(60) + '\n');
        this.initialized = true;
        return deviceCodeResult.accessToken;
    }

    /**
     * Search for the latest RKA Petroleum price quote email
     */
    private async findLatestRkaEmail(accessToken: string): Promise<any | null> {
        try {
            // Search for emails from RKA Petroleum (automail@rka.com)
            const searchUrl = `${GRAPH_BASE}/me/messages`;
            
            // Using $search instead of $filter + $orderby is more robust for personal Outlook
            // $search automatically orders results by date descending.
            const params = {
                $search: '"from:automail@RKA.com"',
                $top: 1,
                $select: 'id,subject,receivedDateTime,from,hasAttachments',
            };

            const response = await axios.get(searchUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params,
            });

            const messages = response.data?.value;
            if (!messages || messages.length === 0) {
                // Fallback: search by subject keyword
                console.log('📧 No emails from automail@RKA.com, trying subject search...');
                const fallbackParams = {
                    $search: '"GBS P&S LLC"',
                    // removed $orderby as it causes InefficientFilter with $search
                    $top: 1,
                    $select: 'id,subject,receivedDateTime,from,hasAttachments',
                };

                const fallbackResponse = await axios.get(searchUrl, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: fallbackParams,
                });

                const fallbackMessages = fallbackResponse.data?.value;
                if (!fallbackMessages || fallbackMessages.length === 0) {
                    console.log('⚠️ No RKA price quote emails found');
                    return null;
                }
                return fallbackMessages[0];
            }

            return messages[0];
        } catch (err: any) {
            console.error('❌ Error searching for RKA email:', err.response?.data || err.message);
            return null;
        }
    }

    /**
     * Download PDF attachment from an email
     */
    private async downloadPdfAttachment(
        accessToken: string,
        messageId: string
    ): Promise<Buffer | null> {
        try {
            // List attachments for the message
            const attachmentsUrl = `${GRAPH_BASE}/me/messages/${messageId}/attachments`;
            const response = await axios.get(attachmentsUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    // Removed 'contentBytes' from $select as it causes BadRequest 'OData Select and Expand failed'
                    $select: 'id,name,contentType,size',
                },
            });

            const attachments = response.data?.value;
            if (!attachments || attachments.length === 0) {
                console.log('⚠️ No attachments found on RKA email');
                return null;
            }

            // Find a PDF attachment
            const pdfAttachment = attachments.find(
                (att: any) =>
                    att.name?.toLowerCase().endsWith('.pdf') ||
                    att.contentType === 'application/pdf'
            );

            if (!pdfAttachment) {
                console.log('⚠️ No PDF attachment found on RKA email');
                console.log('   Available attachments:', attachments.map((a: any) => a.name).join(', '));
                return null;
            }

            console.log(`📎 Found PDF attachment: ${pdfAttachment.name} (${(pdfAttachment.size / 1024).toFixed(1)} KB)`);

            // contentBytes is base64-encoded
            if (pdfAttachment.contentBytes) {
                return Buffer.from(pdfAttachment.contentBytes, 'base64');
            }

            // If contentBytes is not inline, fetch the attachment content separately
            const contentUrl = `${GRAPH_BASE}/me/messages/${messageId}/attachments/${pdfAttachment.id}/$value`;
            const contentResponse = await axios.get(contentUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
                responseType: 'arraybuffer',
            });

            return Buffer.from(contentResponse.data);
        } catch (err: any) {
            console.error('❌ Error downloading PDF attachment:', err.response?.data || err.message);
            return null;
        }
    }

    private parsePriceQuoteText(text: string): FuelPriceEntry[] {
        const prices: FuelPriceEntry[] = [];
        // Flatten all whitespace (newlines, tabs) into single spaces for robust scanning
        const normalized = text.replace(/\s+/g, ' ');

        console.log('📄 PDF text extracted, parsing prices (robust method)...');
        
        // Find the effective date
        let effectiveDate = 'N/A';
        const dateMatch = normalized.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
        if (dateMatch) {
            effectiveDate = dateMatch[1];
        }

        // Define expected RKA fuel products
        const products = [
            { id: '87_reg', search: /87\s*Regular.*?(?:Gasoline|E10)?/i, formatted: '87 Regular Gasoline E10' },
            { id: '89_mid', search: /89\s*Mid[ \-]*Grade/i, formatted: '89 Mid-Grade Conventional' },
            { id: '91_sup', search: /91\s*Super/i, formatted: '91 Super Gasoline' },
            { id: '93_pre', search: /93\s*Premium.*?(?:Gasoline|E10)?/i, formatted: '93 Premium Gasoline E10' },
            { id: 'diesel', search: /#2\s*Ultra\s*Low\s*Sulfur\s*Diesel|Diesel/i, formatted: '#2 Ultra Low Sulfur Diesel' },
            { id: 'rec', search: /Rec\s*Fuel/i, formatted: 'Rec Fuel' },
            { id: 'offroad', search: /Off[\s\-]*Road/i, formatted: 'Off Road Diesel' }
        ];

        // 1. Find all high-precision decimal numbers (e.g. 2.965110)
        // Values usually between 1.000000 and 6.999999
        const decimalsRegex = /(?:^|\b)([1-6]\.\d{4,6})(?=\b|$)/g;
        const decimals: { val: number, index: number }[] = [];
        let m;
        while ((m = decimalsRegex.exec(normalized)) !== null) {
            decimals.push({ val: parseFloat(m[1]), index: m.index });
        }

        // 2. Pair them up (w/o tax and tax costs come sequentially)
        const pricePairs: { p1: number, p2: number, index: number }[] = [];
        for (let i = 0; i < decimals.length - 1; i++) {
            // Check if they are listed adjacently within 50 characters of each other
            const dist = decimals[i+1].index - decimals[i].index;
            if (dist > 0 && dist < 50) {
                const vals = [decimals[i].val, decimals[i+1].val].sort((a, b) => a - b);
                pricePairs.push({
                    p1: Math.round(vals[0] * 1000000) / 1000000, // round to 6 decimals for precise quoting
                    p2: Math.round(vals[1] * 1000000) / 1000000,
                    index: decimals[i].index
                });
                i++; // advance past the second item in the pair
            }
        }

        // 3. Match each pair backwards to the closest product label
        for (const pair of pricePairs) {
            // Get the preceding text chunk (up to 150 chars backward should be plenty)
            const textBefore = normalized.substring(Math.max(0, pair.index - 150), pair.index);
            
            let bestName = '';
            let bestDist = 999;

            for (const prod of products) {
                // Find all matches of this product in the preceding text chunk
                const matches = [...textBefore.matchAll(new RegExp(prod.search, 'gi'))];
                if (matches.length > 0) {
                    const lastMatch = matches[matches.length - 1]; // get the closest one to the end
                    const dist = textBefore.length - (lastMatch.index! + lastMatch[0].length);
                    
                    if (dist < bestDist && dist < 120) {
                        bestDist = dist;
                        bestName = prod.formatted;
                    }
                }
            }

            // Only add if we confidently found a product name and haven't added it yet
            if (bestName && !prices.some(p => p.product === bestName)) {
                prices.push({
                    effectiveDate,
                    effectiveTime: 'N/A',
                    product: bestName,
                    deliveryLocation: "1057 Estey Rd", // Clean default
                    costPerGallon: pair.p1,
                    costWithTaxes: pair.p2
                });
            }
        }

        console.log(`   ✅ Extracted ${prices.length} fuel price(s) reliably`);
        for (const p of prices) {
            console.log(`      ${p.product}: $${p.costPerGallon} (w/tax: $${p.costWithTaxes})`);
        }

        return prices;
    }

    private normalizeQuoteDate(raw: string): string {
        const trimmed = raw.trim();

        const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (isoMatch) {
            const [, year, month, day] = isoMatch;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
        if (slashMatch) {
            let [, month, day, year] = slashMatch;
            if (!year) year = String(new Date().getFullYear());
            if (year.length === 2) year = `20${year}`;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        return trimmed;
    }

    private extractQuoteDate(text: string, fallbackIso?: string): string {
        const normalized = text.replace(/\s+/g, ' ');

        const labeledDateMatch = normalized.match(
            /\bDate\s*[:\-]?\s*(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i
        );
        if (labeledDateMatch) {
            return this.normalizeQuoteDate(labeledDateMatch[1]);
        }

        const anyDateMatch = normalized.match(/\b(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/);
        if (anyDateMatch) {
            return this.normalizeQuoteDate(anyDateMatch[1]);
        }

        return fallbackIso?.split('T')[0] || new Date().toISOString().split('T')[0];
    }

    /**
     * Get the latest RKA fuel price quote from the Hotmail inbox
     * Returns null if unavailable (auth issues, no emails, parse failure)
     */
    async getLatestFuelPriceQuote(): Promise<FuelPriceQuote | null> {
        // Check if Microsoft credentials are configured
        if (!process.env.MICROSOFT_CLIENT_ID) {
            console.log('⚠️ MICROSOFT_CLIENT_ID not set — skipping fuel price quote fetch');
            return null;
        }

        try {
            console.log('\n📧 ========== FETCHING RKA FUEL PRICE QUOTE ==========');

            // Step 1: Authenticate
            const accessToken = await this.getAccessToken();

            // Step 2: Find the latest RKA email
            const email = await this.findLatestRkaEmail(accessToken);
            if (!email) {
                console.log('⚠️ No RKA price quote email found');
                console.log('✅ ========== PRICE QUOTE FETCH COMPLETED (no data) ==========\n');
                return null;
            }

            console.log(`📧 Found RKA email: "${email.subject}" (${email.receivedDateTime})`);

            // Step 3: Download PDF attachment
            const pdfBuffer = await this.downloadPdfAttachment(accessToken, email.id);
            if (!pdfBuffer) {
                console.log('⚠️ Could not download PDF attachment');
                console.log('✅ ========== PRICE QUOTE FETCH COMPLETED (no PDF) ==========\n');
                return null;
            }

            // Step 4: Extract text from PDF
            const parser = new PDFParse({ data: pdfBuffer });
            let pdfText = '';
            let numPages = 0;
            
            try {
                const pdfData = await parser.getText();
                pdfText = pdfData.text;
                numPages = pdfData.total || 1;
                console.log(`📄 PDF parsed: ${numPages} page(s), ${pdfText.length} chars`);
            } finally {
                await parser.destroy();
            }

            // Step 5: Parse prices from extracted text
            const prices = this.parsePriceQuoteText(pdfText);

            // Step 6: Extract customer number from PDF
            let customerNumber = '';
            const custMatch = pdfText.match(/Customer\s*(?:Number|#|No\.?)[\s:]*(\d+)/i);
            if (custMatch) customerNumber = custMatch[1];

            const quote: FuelPriceQuote = {
                quoteDate: this.extractQuoteDate(pdfText, email.receivedDateTime),
                supplier: 'RKA Petroleum',
                customerNumber,
                prices,
                rawText: pdfText.substring(0, 2000), // first 2000 chars for debugging
            };

            console.log(`✅ ========== PRICE QUOTE FETCH COMPLETED (${prices.length} prices) ==========\n`);
            return quote;
        } catch (err: any) {
            console.error('❌ Error fetching fuel price quote:', err.message);
            if (err.message?.includes('interaction_required') || err.message?.includes('token')) {
                console.log('💡 Tip: The Outlook authentication may have expired. Restart the server to re-authenticate.');
            }
            console.log('✅ ========== PRICE QUOTE FETCH COMPLETED (error) ==========\n');
            return null;
        }
    }
}

// Export singleton
export const outlookEmailService = new OutlookEmailService();
