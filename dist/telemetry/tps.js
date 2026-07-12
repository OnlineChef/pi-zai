export function computeTps(outputTokens, durationMs) {
    if (outputTokens <= 0 || durationMs <= 0) {
        return 0;
    }
    return outputTokens / (durationMs / 1000);
}
export function formatTps(value) {
    if (value <= 0) {
        return "0";
    }
    return Math.round(value).toString();
}
export function formatDurationMs(durationMs) {
    if (durationMs < 1000) {
        return `${Math.round(durationMs)}ms`;
    }
    return `${(durationMs / 1000).toFixed(1)}s`;
}
export function formatTpsStatusLine(sample, rolling, showAvg) {
    const last = formatTps(sample.tps);
    if (!showAvg || rolling.requests <= 1) {
        return `${last} tok/s`;
    }
    return `${last} tok/s (avg ${formatTps(rolling.avgTps)})`;
}
export function formatTpsTelemetryLines(stats) {
    if (!stats?.last) {
        return ["  none"];
    }
    const { last, rolling } = stats;
    const lines = [
        `  Last: ${formatTps(last.tps)} tok/s (${formatDurationMs(last.durationMs)}, ${last.outputTokens.toLocaleString("en-US")} out)`,
    ];
    if (last.ttftMs !== undefined) {
        lines.push(`  TTFT: ${formatDurationMs(last.ttftMs)}`);
    }
    if (rolling.requests > 0) {
        lines.push(`  Session avg: ${formatTps(rolling.avgTps)} tok/s (${rolling.requests} ${rolling.requests === 1 ? "request" : "requests"})`);
    }
    return lines;
}
export class TpsTracker {
    inFlight;
    stats = {
        last: undefined,
        rolling: {
            generationTokens: 0,
            durationMs: 0,
            requests: 0,
            avgTps: 0,
        },
    };
    beginAssistantMessage(startedAt = Date.now()) {
        this.inFlight = { startedAt, ttftMs: undefined };
    }
    markFirstToken(now = Date.now()) {
        if (!this.inFlight || this.inFlight.ttftMs !== undefined) {
            return;
        }
        this.inFlight.ttftMs = Math.max(0, now - this.inFlight.startedAt);
    }
    completeAssistantMessage(usage, endedAt = Date.now()) {
        if (!this.inFlight) {
            return undefined;
        }
        const durationMs = Math.max(1, endedAt - this.inFlight.startedAt);
        const outputTokens = usage.output;
        const sample = {
            outputTokens,
            reasoningTokens: usage.reasoning ?? 0,
            durationMs,
            ttftMs: this.inFlight.ttftMs,
            tps: computeTps(outputTokens, durationMs),
            timestamp: endedAt,
        };
        const rolling = this.stats.rolling;
        rolling.generationTokens += outputTokens;
        rolling.durationMs += durationMs;
        rolling.requests += 1;
        rolling.avgTps = computeTps(rolling.generationTokens, rolling.durationMs);
        this.stats.last = sample;
        this.inFlight = undefined;
        return sample;
    }
    get() {
        return this.stats;
    }
    reset() {
        this.inFlight = undefined;
        this.stats = {
            last: undefined,
            rolling: {
                generationTokens: 0,
                durationMs: 0,
                requests: 0,
                avgTps: 0,
            },
        };
    }
}
//# sourceMappingURL=tps.js.map