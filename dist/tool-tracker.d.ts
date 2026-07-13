export type ToolExecutionSample = {
    toolName: string;
    durationMs: number;
    isError: boolean;
    timestamp: number;
    queryId: string | undefined;
};
export type ToolNameStats = {
    toolName: string;
    count: number;
    errors: number;
    totalMs: number;
    avgMs: number;
};
export type ToolTurnStats = {
    executions: number;
    errors: number;
    totalMs: number;
};
export type ToolSessionStats = {
    executions: number;
    errors: number;
    totalMs: number;
    avgMs: number;
    byTool: ToolNameStats[];
    last: ToolExecutionSample | undefined;
    inFlight: number;
    turn: ToolTurnStats;
};
export declare class ToolExecutionTracker {
    private readonly inFlight;
    private readonly byTool;
    private executions;
    private errors;
    private totalMs;
    private turnExecutions;
    private turnErrors;
    private turnTotalMs;
    private last;
    beginTurn(): void;
    begin(toolCallId: string, toolName: string, queryId: string | undefined, now?: number): void;
    complete(toolCallId: string, toolName: string, isError: boolean, now?: number): ToolExecutionSample | undefined;
    getTurnStats(): ToolTurnStats;
    get(): ToolSessionStats;
    reset(): void;
}
export declare function formatToolSessionLines(stats: ToolSessionStats): string[];
//# sourceMappingURL=tool-tracker.d.ts.map