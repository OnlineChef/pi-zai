import type { BenchmarkRunManifest, BenchmarkRunRecord, BenchmarkRunReport } from "../benchmark/types.ts";
import { type AnonymousDailySummary, type CleanupResult, type MetricsExportFormat, type MetricsStorage, type MetricsStorageKind, type ProviderAttemptRecord, type StorageStatus, type TransportSummary, type UsageFilter, type UsageSummary } from "./types.ts";
export interface MemoryStorageOptions {
    enabled?: boolean;
    retentionDays?: number;
}
export declare class MemoryStorage implements MetricsStorage {
    readonly kind: MetricsStorageKind;
    private readonly enabled;
    private readonly retentionDays;
    private records;
    private benchmarkRuns;
    private telemetryUploadedDays;
    constructor(options?: MemoryStorageOptions);
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
    private filtered;
}
//# sourceMappingURL=memory.d.ts.map