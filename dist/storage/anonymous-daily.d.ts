import type { AnonymousDailySummary, ProviderAttemptRecord } from "./types.ts";
export declare function utcDayFromMs(timestampMs: number): string;
export declare function endpointKindFromProvider(provider: string): string;
export declare function isAttemptError(record: ProviderAttemptRecord): boolean;
export declare function summarizeAnonymousDaily(records: readonly ProviderAttemptRecord[]): AnonymousDailySummary;
export declare function mergeAnonymousDailySummaries(summaries: readonly AnonymousDailySummary[]): AnonymousDailySummary | undefined;
//# sourceMappingURL=anonymous-daily.d.ts.map