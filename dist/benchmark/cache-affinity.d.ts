export type SessionHeaderMode = "stable" | "none" | "rotating";
export type TurnResult = {
    turn: number;
    promptTokens: number;
    cachedTokens: number;
    latencyMs: number;
    error?: string;
};
export type TrialResult = {
    mode: SessionHeaderMode;
    trial: number;
    nonce: string;
    turns: TurnResult[];
};
export type ModeSummary = {
    mode: SessionHeaderMode;
    trials: number;
    turnsPerTrial: number;
    warmTurns: number;
    warmCacheHitRatio: number;
    warmCacheHitRatioMedian: number;
    warmCacheHitRatioP25: number;
    warmCacheHitRatioP75: number;
    avgLatencyMs: number;
    errors: number;
    trialRatios: number[];
};
export type BenchmarkConfig = {
    baseUrl: string;
    apiKey: string;
    model: string;
    trials: number;
    turns: number;
    prefixLines: number;
    retryAttempts: number;
    retryDelayMs: number;
    turnDelayMs: number;
    trialDelayMs: number;
    timeoutMs: number;
};
export type BenchmarkReport = {
    config: Omit<BenchmarkConfig, "apiKey">;
    summaries: ModeSummary[];
    winner: SessionHeaderMode | "inconclusive";
};
export declare function sessionHeaderForMode(mode: SessionHeaderMode, stableId: string, turn: number): string | undefined;
export declare function buildStablePrefix(nonce: string, prefixLines: number): string;
export declare function warmCacheHitRatio(turns: TurnResult[]): number;
export declare function summarizeMode(mode: SessionHeaderMode, trials: TrialResult[], turnsPerTrial: number): ModeSummary;
export declare function pickWinner(summaries: ModeSummary[]): SessionHeaderMode | "inconclusive";
export declare function buildReport(config: BenchmarkConfig, byMode: Map<SessionHeaderMode, TrialResult[]>): BenchmarkReport;
export declare function formatPercent(ratio: number): string;
export declare function formatReport(report: BenchmarkReport): string;
export declare function runSingleTurn(config: BenchmarkConfig, system: string, messages: {
    role: string;
    content: string;
}[], sessionHeader: string | undefined): Promise<TurnResult>;
export declare function runTrial(config: BenchmarkConfig, mode: SessionHeaderMode, trialIndex: number): Promise<TrialResult>;
export declare function runCacheAffinityBenchmark(config: BenchmarkConfig): Promise<BenchmarkReport>;
export declare function loadBenchmarkConfigFromEnv(env?: NodeJS.ProcessEnv): BenchmarkConfig | {
    error: string;
};
//# sourceMappingURL=cache-affinity.d.ts.map