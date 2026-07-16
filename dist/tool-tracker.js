export class ToolExecutionTracker {
    inFlight = new Map();
    byTool = new Map();
    executions = 0;
    errors = 0;
    totalMs = 0;
    turnExecutions = 0;
    turnErrors = 0;
    turnTotalMs = 0;
    last;
    beginTurn() {
        this.turnExecutions = 0;
        this.turnErrors = 0;
        this.turnTotalMs = 0;
    }
    begin(toolCallId, toolName, queryId, now = Date.now()) {
        this.inFlight.set(toolCallId, {
            toolCallId,
            toolName,
            startedAt: now,
            queryId,
        });
    }
    complete(toolCallId, toolName, isError, now = Date.now()) {
        const started = this.inFlight.get(toolCallId);
        // Ignore orphan ends (duplicate/out-of-order events) so they do not
        // inflate turn or session counters with zero-duration phantoms.
        if (!started)
            return undefined;
        this.inFlight.delete(toolCallId);
        const durationMs = Math.max(0, now - started.startedAt);
        const resolvedName = started.toolName || toolName;
        const sample = {
            toolName: resolvedName,
            durationMs,
            isError,
            timestamp: now,
            queryId: started.queryId,
        };
        this.executions += 1;
        this.totalMs += durationMs;
        this.turnExecutions += 1;
        this.turnTotalMs += durationMs;
        if (isError) {
            this.errors += 1;
            this.turnErrors += 1;
        }
        const current = this.byTool.get(resolvedName) ?? {
            count: 0,
            errors: 0,
            totalMs: 0,
        };
        current.count += 1;
        current.totalMs += durationMs;
        if (isError)
            current.errors += 1;
        this.byTool.set(resolvedName, current);
        this.last = sample;
        return sample;
    }
    getTurnStats() {
        return {
            executions: this.turnExecutions,
            errors: this.turnErrors,
            totalMs: this.turnTotalMs,
        };
    }
    get() {
        const byTool = [...this.byTool.entries()]
            .map(([toolName, stats]) => ({
            toolName,
            count: stats.count,
            errors: stats.errors,
            totalMs: stats.totalMs,
            avgMs: stats.count > 0 ? Math.round(stats.totalMs / stats.count) : 0,
        }))
            .sort((left, right) => {
            if (right.count !== left.count)
                return right.count - left.count;
            return left.toolName.localeCompare(right.toolName);
        });
        return {
            executions: this.executions,
            errors: this.errors,
            totalMs: this.totalMs,
            avgMs: this.executions > 0 ? Math.round(this.totalMs / this.executions) : 0,
            byTool,
            last: this.last,
            inFlight: this.inFlight.size,
            turn: this.getTurnStats(),
        };
    }
    reset() {
        this.inFlight.clear();
        this.byTool.clear();
        this.executions = 0;
        this.errors = 0;
        this.totalMs = 0;
        this.turnExecutions = 0;
        this.turnErrors = 0;
        this.turnTotalMs = 0;
        this.last = undefined;
    }
}
export function formatToolSessionLines(stats) {
    if (stats.executions === 0 && stats.inFlight === 0) {
        return ["  none yet"];
    }
    const lines = [
        `  Executions: ${stats.executions}${stats.errors > 0 ? ` (${stats.errors} errors)` : ""}`,
    ];
    if (stats.executions > 0) {
        lines.push(`  Avg duration: ${stats.avgMs} ms`);
    }
    if (stats.inFlight > 0) {
        lines.push(`  In flight: ${stats.inFlight}`);
    }
    if (stats.last) {
        lines.push(`  Last: ${stats.last.toolName} (${stats.last.durationMs} ms${stats.last.isError ? ", error" : ""})`);
    }
    if (stats.byTool.length > 0) {
        const top = stats.byTool
            .slice(0, 8)
            .map((entry) => entry.errors > 0
            ? `${entry.toolName} ${entry.count}(!${entry.errors})`
            : `${entry.toolName} ${entry.count}`)
            .join(" · ");
        lines.push(`  By tool: ${top}`);
    }
    return lines;
}
//# sourceMappingURL=tool-tracker.js.map