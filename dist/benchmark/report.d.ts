import type { SessionCacheStats } from "../cache/metrics.ts";
import type { TransportSummary, UsageSummary } from "../storage/types.ts";
import { type BenchmarkScenarioId, type BenchmarkVariantId } from "./manifest.ts";
import type { BenchmarkGateCheck, BenchmarkRunManifest, BenchmarkRunRecord, BenchmarkRunReport } from "./types.ts";
export type BenchmarkReportInput = {
    manifest: BenchmarkRunManifest;
    completedAt: number;
    usage: UsageSummary;
    transport: TransportSummary;
    cache: SessionCacheStats | undefined;
    completedRunsForVariant: number;
    turnsObserved: number;
};
export declare function buildBenchmarkRunReport(input: BenchmarkReportInput): BenchmarkRunReport;
export declare function evaluateRunGates(variant: BenchmarkVariantId, scenario: BenchmarkScenarioId, turnsObserved: number, completedRunsForVariant: number): BenchmarkGateCheck[];
export declare function formatBenchmarkRunReport(record: BenchmarkRunRecord): string;
export declare function formatBenchmarkGatesSummary(runs: readonly {
    variant: BenchmarkVariantId;
    scenario: BenchmarkScenarioId;
    report?: BenchmarkRunReport;
}[]): string;
//# sourceMappingURL=report.d.ts.map