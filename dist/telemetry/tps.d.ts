import type { Usage } from "@earendil-works/pi-ai";
export type TpsSample = {
    outputTokens: number;
    reasoningTokens: number;
    durationMs: number;
    ttftMs: number | undefined;
    tps: number;
    timestamp: number;
};
export type TpsRollingStats = {
    generationTokens: number;
    durationMs: number;
    requests: number;
    avgTps: number;
};
export type TurnThroughputSample = {
    outputTokens: number;
    generationMs: number;
    toolMs: number;
    toolCalls: number;
    wallMs: number;
    generationTps: number;
    effectiveTps: number;
};
export type TurnThroughputStats = {
    last: TurnThroughputSample | undefined;
};
export type TpsStats = {
    last: TpsSample | undefined;
    rolling: TpsRollingStats;
    turn: TurnThroughputStats;
};
export declare function computeTps(outputTokens: number, durationMs: number): number;
export declare function formatTps(value: number): string;
export declare function formatDurationMs(durationMs: number): string;
export declare function formatTpsStatusLine(sample: TpsSample, rolling: TpsRollingStats, showAvg: boolean): string;
export declare function formatTpsTelemetryLines(stats: TpsStats | undefined): string[];
export declare function formatTurnThroughputLines(turn: TurnThroughputStats | undefined): string[];
export declare class TpsTracker {
    private inFlight;
    private turnStartedAt;
    private turnOutputTokens;
    private turnGenerationMs;
    private stats;
    beginTurn(startedAt?: number): void;
    completeTurn(input: {
        toolMs: number;
        toolCalls: number;
        endedAt?: number;
    }): TurnThroughputSample | undefined;
    beginAssistantMessage(startedAt?: number): void;
    markFirstToken(now?: number): void;
    completeAssistantMessage(usage: Pick<Usage, "output" | "reasoning">, endedAt?: number): TpsSample | undefined;
    get(): TpsStats;
    reset(): void;
}
//# sourceMappingURL=tps.d.ts.map