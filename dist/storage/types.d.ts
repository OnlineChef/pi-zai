import type { BenchmarkRunManifest, BenchmarkRunRecord, BenchmarkRunReport } from "../benchmark/types.ts";
export type MetricsStorageKind = "off" | "memory" | "sqlite";
export type MetricsExportFormat = "json" | "csv";
export interface ProviderAttemptRecord {
    occurredAt: number;
    projectId?: string;
    sessionHash?: string;
    queryId?: string;
    requestId?: string;
    attempt: number;
    provider: string;
    model: string;
    endpointKind: string;
    thinkingLevel?: string;
    piVersion?: string;
    extensionVersion: string;
    systemFingerprint?: string;
    toolsetFingerprint?: string;
    payloadFingerprint?: string;
    inputTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    outputTokens?: number;
    requestToHeadersMs?: number;
    requestToFirstDeltaMs?: number;
    totalMs?: number;
    httpStatus?: number;
    errorCategory?: string;
    estimatedApiCostMicrousd?: number;
}
export interface UsageFilter {
    projectId?: string;
    since?: number;
}
export interface UsageSummary {
    attempts: number;
    errors: number;
    inputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    outputTokens: number;
    estimatedApiCostMicrousd: number;
    cacheHitRatio: number;
    firstOccurredAt?: number;
    lastOccurredAt?: number;
}
export interface TransportSummary {
    attempts: number;
    errors: number;
    avgRequestToHeadersMs?: number;
    avgRequestToFirstDeltaMs?: number;
    avgTotalMs?: number;
    errorCategories: Record<string, number>;
}
export interface StorageStatus {
    kind: MetricsStorageKind;
    location?: string;
    databaseBytes?: number;
    detailRows: number;
    rollupRows: number;
    benchmarkRows: number;
    lastCleanupAt?: number;
    degraded: boolean;
}
export interface CleanupResult {
    attemptsDeleted: number;
    rollupsDeleted: number;
    benchmarksDeleted: number;
    ran: boolean;
}
export type AnonymousProviderModelSummary = {
    provider: string;
    model: string;
    endpointKind: string;
    attempts: number;
    errors: number;
};
export type AnonymousDailySummary = {
    attempts: number;
    errors: number;
    inputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    outputTokens: number;
    byProviderModel: AnonymousProviderModelSummary[];
    errorCategories: Record<string, number>;
};
export interface MetricsStorage {
    readonly kind: MetricsStorageKind;
    initialize(): void;
    recordAttempt(record: ProviderAttemptRecord): void;
    getUsageSummary(filter?: UsageFilter): UsageSummary;
    getTransportSummary(filter?: UsageFilter): TransportSummary;
    getStatus(): StorageStatus;
    runCleanup(now: number, force?: boolean): CleanupResult;
    clearProject(projectId: string): void;
    clearDetails(): void;
    clearBenchmarks(): void;
    startBenchmarkRun(manifest: BenchmarkRunManifest): void;
    completeBenchmarkRun(runId: string, report: BenchmarkRunReport): boolean;
    listBenchmarkRuns(): BenchmarkRunRecord[];
    getBenchmarkRun(runId: string): BenchmarkRunRecord | undefined;
    clearAll(): void;
    exportData(format: MetricsExportFormat, filter?: UsageFilter): string;
    vacuum(): void;
    close(): void;
    getAnonymousDailySummary(day: string): AnonymousDailySummary | undefined;
    listTelemetryDays(): string[];
    listPendingTelemetryDays(now?: number): string[];
    isTelemetryDayUploaded(day: string): boolean;
    markTelemetryDayUploaded(day: string, uploadedAt: number): void;
}
export declare const EMPTY_USAGE_SUMMARY: UsageSummary;
export declare const EMPTY_TRANSPORT_SUMMARY: TransportSummary;
export declare function summarizeTransportFromAttempts(records: readonly ProviderAttemptRecord[]): TransportSummary;
export declare function summarizeAttempts(records: readonly ProviderAttemptRecord[]): UsageSummary;
export declare function serializeAttempts(records: readonly ProviderAttemptRecord[], format: MetricsExportFormat): string;
//# sourceMappingURL=types.d.ts.map