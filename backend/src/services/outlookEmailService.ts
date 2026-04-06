import * as msal from '@azure/msal-node';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import dotenv from 'dotenv';
import { FuelPriceQuote, FuelPriceEntry } from '../types/fuelTypes';

dotenv.config();

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const TOKEN_CACHE_PATH = path.resolve(__dirname, '../../.msal-token-cache.json');

const msalConfig: msal.Configuration = {
    auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID || '',
        authority: 'https://login.microsoftonline.com/consumers',
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
                    console.warn('Could not read MSAL token cache:', (err as Error).message);
                }
            },
            afterCacheAccess: async (cacheContext: msal.TokenCacheContext) => {
                if (cacheContext.cacheHasChanged) {
                    try {
                        fs.writeFileSync(TOKEN_CACHE_PATH, cacheContext.tokenCache.serialize());
                    } catch (err) {
                        console.warn('Could not write MSAL token cache:', (err as Error).message);
                    }
                }
            },
        },
    },
};

class OutlookEmailService {
    private pca: msal.PublicClientApplication;
    private initialized = false;

    constructor() {
        this.pca = new msal.PublicClientApplication(msalConfig);
    }

    private async getAccessToken(): Promise<string> {
        const scopes = ['Mail.Read', 'Mail.ReadBasic'];

        const accounts = await this.pca.getTokenCache().getAllAccounts();
        if (accounts.length > 0) {
            try {
                const silentResult = await this.pca.acquireTokenSilent({
                    account: accounts[0],
                    scopes,
                });

                if (silentResult?.accessToken) {
                    if (!this.initialized) {
                        console.log('Outlook: Authenticated silently (cached token)');
                        this.initialized = true;
                    }
                    return silentResult.accessToken;
                }
            } catch {
                console.log('Outlook: Silent token acquisition failed, will use device code flow');
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('OUTLOOK EMAIL AUTHENTICATION REQUIRED');
        console.log('='.repeat(60));

        const deviceCodeResult = await this.pca.acquireTokenByDeviceCode({
            scopes,
            deviceCodeCallback: (response) => {
                console.log('\nTo sign in to sandymarket-gbs@hotmail.com:');
                console.log(`   1. Open: ${response.verificationUri}`);
                console.log(`   2. Enter code: ${response.userCode}`);
                console.log('   3. Sign in with your Hotmail account\n');
                console.log('Waiting for you to complete sign-in...');
            },
        });

        if (!deviceCodeResult?.accessToken) {
            throw new Error('Failed to acquire access token via device code flow');
        }

        console.log('Outlook: Successfully authenticated!');
        console.log('='.repeat(60) + '\n');
        this.initialized = true;
        return deviceCodeResult.accessToken;
    }

    private async findLatestRkaEmails(accessToken: string, limit = 1): Promise<any[]> {
        try {
            const searchUrl = `${GRAPH_BASE}/me/messages`;
            const fetchCount = Math.max(limit * 8, 10);
            const params = {
                $search: '"from:automail@RKA.com"',
                $top: fetchCount,
                $select: 'id,subject,receivedDateTime,from,hasAttachments',
            };

            const response = await axios.get(searchUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params,
            });

            const messages = response.data?.value || [];
            const rankedMessages = this.selectLatestEmailPerDay(this.rankQuoteEmails(messages));
            if (rankedMessages.length > 0) {
                return rankedMessages.slice(0, limit);
            }

            console.log('No emails from automail@RKA.com, trying subject search...');

            const fallbackResponse = await axios.get(searchUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    $search: '"GBS P&S LLC"',
                    $top: fetchCount,
                    $select: 'id,subject,receivedDateTime,from,hasAttachments',
                },
            });

            const fallbackMessages = this.selectLatestEmailPerDay(
                this.rankQuoteEmails(fallbackResponse.data?.value || [])
            );
            if (!fallbackMessages || fallbackMessages.length === 0) {
                console.log('No RKA price quote emails found');
                return [];
            }

            return fallbackMessages.slice(0, limit);
        } catch (err: any) {
            console.error('Error searching for RKA email:', err.response?.data || err.message);
            return [];
        }
    }

    private async downloadPdfAttachment(accessToken: string, messageId: string): Promise<Buffer | null> {
        try {
            const encodedMessageId = encodeURIComponent(messageId);
            const attachmentsUrl = `${GRAPH_BASE}/me/messages/${encodedMessageId}/attachments`;
            const response = await axios.get(attachmentsUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            const attachments = response.data?.value;
            if (!attachments || attachments.length === 0) {
                console.log('No attachments found on RKA email');
                return null;
            }

            const pdfAttachment = attachments.find(
                (attachment: any) =>
                    attachment.name?.toLowerCase().endsWith('.pdf') ||
                    attachment.contentType === 'application/pdf'
            );

            if (!pdfAttachment) {
                console.log('No PDF attachment found on RKA email');
                console.log('Available attachments:', attachments.map((attachment: any) => attachment.name).join(', '));
                return null;
            }

            console.log(`Found PDF attachment: ${pdfAttachment.name} (${(pdfAttachment.size / 1024).toFixed(1)} KB)`);

            if (pdfAttachment.contentBytes) {
                return Buffer.from(pdfAttachment.contentBytes, 'base64');
            }

            const encodedAttachmentId = encodeURIComponent(pdfAttachment.id);
            const contentUrl = `${GRAPH_BASE}/me/messages/${encodedMessageId}/attachments/${encodedAttachmentId}/$value`;
            const contentResponse = await axios.get(contentUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
                responseType: 'arraybuffer',
            });

            return Buffer.from(contentResponse.data);
        } catch (err: any) {
            console.error('Error downloading PDF attachment:', err.response?.data || err.message);
            return null;
        }
    }

    private rankQuoteEmails(emails: any[]): any[] {
        const scoreEmail = (email: any): number => {
            const subject = String(email?.subject || '').toLowerCase();
            let score = 0;

            if (email?.hasAttachments) score += 10;
            if (subject.includes('for gbs p&s llc')) score += 8;
            if (subject.includes("sandy's market")) score += 5;
            if (subject.includes('price quote')) score += 4;
            if (subject.includes('quote')) score += 3;
            if (subject.includes('.pdf')) score += 1;
            if (subject.includes('dtn credit cards')) score -= 20;

            return score;
        };

        return [...emails]
            .filter((email) => Boolean(email?.id))
            .sort((a, b) => {
                const scoreDiff = scoreEmail(b) - scoreEmail(a);
                if (scoreDiff !== 0) return scoreDiff;

                const timeA = new Date(a?.receivedDateTime || 0).getTime();
                const timeB = new Date(b?.receivedDateTime || 0).getTime();
                return timeB - timeA;
            });
    }

    private selectLatestEmailPerDay(emails: any[]): any[] {
        const seenDates = new Set<string>();
        const uniqueEmails: any[] = [];

        for (const email of emails) {
            const receivedDate = String(email?.receivedDateTime || '').split('T')[0];
            if (!receivedDate || seenDates.has(receivedDate)) {
                continue;
            }

            seenDates.add(receivedDate);
            uniqueEmails.push(email);
        }

        return uniqueEmails;
    }

    private parsePriceQuoteText(text: string): FuelPriceEntry[] {
        const prices: FuelPriceEntry[] = [];
        const normalized = text.replace(/\s+/g, ' ');

        console.log('PDF text extracted, parsing prices...');

        let effectiveDate = 'N/A';
        const dateMatch = normalized.match(/(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
        if (dateMatch) {
            effectiveDate = this.normalizeQuoteDate(dateMatch[1]);
        }

        const products = [
            { search: /87\s*Regular.*?(?:Gasoline|E10)?/i, formatted: '87 Regular Gasoline E10' },
            { search: /89\s*Mid[ \-]*Grade/i, formatted: '89 Mid-Grade Conventional' },
            { search: /91\s*Super/i, formatted: '91 Super Gasoline' },
            { search: /93\s*Premium.*?(?:Gasoline|E10)?/i, formatted: '93 Premium Gasoline E10' },
            { search: /#2\s*Ultra\s*Low\s*Sulfur\s*Diesel|Diesel/i, formatted: '#2 Ultra Low Sulfur Diesel' },
            { search: /Rec\s*Fuel/i, formatted: 'Rec Fuel' },
            { search: /Off[\s\-]*Road/i, formatted: 'Off Road Diesel' },
        ];

        const decimalsRegex = /(?:^|\b)([1-6]\.\d{4,6})(?=\b|$)/g;
        const decimals: { val: number; index: number }[] = [];
        let match: RegExpExecArray | null;

        while ((match = decimalsRegex.exec(normalized)) !== null) {
            decimals.push({ val: parseFloat(match[1]), index: match.index });
        }

        const pricePairs: { p1: number; p2: number; index: number }[] = [];
        for (let index = 0; index < decimals.length - 1; index++) {
            const distance = decimals[index + 1].index - decimals[index].index;
            if (distance > 0 && distance < 50) {
                const values = [decimals[index].val, decimals[index + 1].val].sort((a, b) => a - b);
                pricePairs.push({
                    p1: Math.round(values[0] * 1000000) / 1000000,
                    p2: Math.round(values[1] * 1000000) / 1000000,
                    index: decimals[index].index,
                });
                index++;
            }
        }

        for (const pair of pricePairs) {
            const textBefore = normalized.substring(Math.max(0, pair.index - 150), pair.index);
            let bestName = '';
            let bestDist = 999;

            for (const product of products) {
                const matches = [...textBefore.matchAll(new RegExp(product.search, 'gi'))];
                if (!matches.length) continue;

                const lastMatch = matches[matches.length - 1];
                const distance = textBefore.length - ((lastMatch.index || 0) + lastMatch[0].length);
                if (distance < bestDist && distance < 120) {
                    bestDist = distance;
                    bestName = product.formatted;
                }
            }

            if (bestName && !prices.some((price) => price.product === bestName)) {
                prices.push({
                    effectiveDate,
                    effectiveTime: 'N/A',
                    product: bestName,
                    deliveryLocation: '1057 Estey Rd',
                    costPerGallon: pair.p1,
                    costWithTaxes: pair.p2,
                });
            }
        }

        console.log(`Extracted ${prices.length} fuel price(s)`);
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

    private async buildFuelPriceQuoteFromEmail(accessToken: string, email: any): Promise<FuelPriceQuote | null> {
        console.log(`Found RKA email: "${email.subject}" (${email.receivedDateTime})`);

        const pdfBuffer = await this.downloadPdfAttachment(accessToken, email.id);
        if (!pdfBuffer) {
            console.log('Could not download PDF attachment');
            return null;
        }

        const parser = new PDFParse({ data: pdfBuffer });
        let pdfText = '';

        try {
            const pdfData = await parser.getText();
            pdfText = pdfData.text;
            console.log(`PDF parsed: ${pdfData.total || 1} page(s), ${pdfText.length} chars`);
        } finally {
            await parser.destroy();
        }

        const prices = this.parsePriceQuoteText(pdfText);
        let customerNumber = '';
        const customerMatch = pdfText.match(/Customer\s*(?:Number|#|No\.?)[\s:]*(\d+)/i);
        if (customerMatch) {
            customerNumber = customerMatch[1];
        }

        return {
            quoteDate: this.extractQuoteDate(pdfText, email.receivedDateTime),
            supplier: 'RKA Petroleum',
            customerNumber,
            prices,
            rawText: pdfText.substring(0, 2000),
        };
    }

    async getLatestFuelPriceQuotes(limit = 2): Promise<FuelPriceQuote[]> {
        if (!process.env.MICROSOFT_CLIENT_ID) {
            console.log('MICROSOFT_CLIENT_ID not set - skipping fuel price quote fetch');
            return [];
        }

        try {
            console.log(`\n========== FETCHING LAST ${limit} RKA FUEL PRICE QUOTE(S) ==========`);

            const accessToken = await this.getAccessToken();
            const emails = await this.findLatestRkaEmails(accessToken, limit);

            if (!emails.length) {
                console.log('No RKA price quote emails found');
                console.log('========== PRICE QUOTE FETCH COMPLETED (no data) ==========\n');
                return [];
            }

            const quotes: FuelPriceQuote[] = [];
            for (const email of emails) {
                const quote = await this.buildFuelPriceQuoteFromEmail(accessToken, email);
                if (quote && quote.prices.length > 0) {
                    quotes.push(quote);
                }
            }

            console.log(`========== PRICE QUOTE FETCH COMPLETED (${quotes.length} quote(s)) ==========\n`);
            return quotes;
        } catch (err: any) {
            console.error('Error fetching fuel price quotes:', err.message);
            if (err.message?.includes('interaction_required') || err.message?.includes('token')) {
                console.log('Tip: Outlook authentication may have expired. Restart the server to re-authenticate.');
            }
            console.log('========== PRICE QUOTE FETCH COMPLETED (error) ==========\n');
            return [];
        }
    }

    async getLatestFuelPriceQuote(): Promise<FuelPriceQuote | null> {
        const quotes = await this.getLatestFuelPriceQuotes(1);
        return quotes[0] || null;
    }
}

export const outlookEmailService = new OutlookEmailService();
