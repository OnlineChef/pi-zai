/**
 * Z.AI Coding Plan usage/quota monitor.
 *
 * Uses the (unofficial but stable) monitor endpoints consumed by Z.AI's own
 * coding plugins. Baseline Pi has no visibility into subscription quota; this
 * surfaces the 5-hour / weekly token windows and monthly MCP tool budget.
 */
export type QuotaLimitType = "TOKENS_LIMIT" | "TIME_LIMIT";
export interface QuotaUsageDetail {
    modelCode: string;
    usage: number;
}
export interface QuotaLimitEntry {
    type: QuotaLimitType;
    unit: number;
    number: number;
    percentage: number;
    nextResetTime?: number;
    usage?: number;
    currentValue?: number;
    remaining?: number;
    usageDetails?: QuotaUsageDetail[];
}
export interface QuotaLimitData {
    limits: QuotaLimitEntry[];
    level: string;
}
export type QuotaFetchResult = {
    ok: true;
    data: QuotaLimitData;
} | {
    ok: false;
    error: string;
};
export type QuotaFetchOptions = {
    headers?: Record<string, string | null | undefined>;
    retries?: number;
    retryDelayMs?: number;
    timeoutMs?: number;
};
/** Derive the monitor base (scheme + host) from a model baseUrl. */
export declare function monitorBaseFromModelUrl(baseUrl: string): string | undefined;
export declare function fetchQuotaLimit(monitorBase: string, apiKey: string, options?: QuotaFetchOptions): Promise<QuotaFetchResult>;
export declare function levelLabel(level: string): string;
export declare function formatResetCountdown(nextResetTime: number | undefined, now?: number): string;
export declare function formatQuotaLimit(data: QuotaLimitData, now?: number): string[];
//# sourceMappingURL=usage-monitor.d.ts.map