export declare function hashSessionId(sessionId: string): string;
export declare function fingerprintPayload(payload: unknown): string;
export declare class QueryCorrelation {
    private queryCounter;
    private currentQueryId;
    private attemptCounter;
    beginQuery(): string;
    nextAttempt(): {
        queryId: string;
        requestId: string;
        attempt: number;
    };
    reset(): void;
}
//# sourceMappingURL=correlation.d.ts.map