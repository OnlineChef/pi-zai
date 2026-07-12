import type { BenchmarkRunManifest, BenchmarkRunRecord, BenchmarkRunReport } from "../benchmark/types.ts";
import { type CleanupResult, type MetricsExportFormat, type MetricsStorage, type ProviderAttemptRecord, type StorageStatus, type TransportSummary, type UsageFilter, type UsageSummary } from "./types.ts";
export interface NodeSqliteStorageOptions {
    databasePath: string;
    retentionDays: number;
    rollupRetentionDays: number;
    maxDatabaseBytes: number;
    onWarning?: (message: string) => void;
}
export declare class NodeSqliteStorage implements MetricsStorage {
    readonly kind: "sqlite";
    private readonly options;
    private readonly fallback;
    private database;
    private insertAttempt;
    private warned;
    private degraded;
    constructor(options: NodeSqliteStorageOptions);
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
    private executeOrDegrade;
    private enforceSizeLimit;
    private degrade;
}
//# sourceMappingURL=sqlite.d.ts.map