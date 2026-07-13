import { summarizeAnonymousDaily, utcDayFromMs } from "./anonymous-daily.js";
import { EMPTY_TRANSPORT_SUMMARY, EMPTY_USAGE_SUMMARY, serializeAttempts, summarizeAttempts, summarizeTransportFromAttempts, } from "./types.js";
export class MemoryStorage {
    kind;
    enabled;
    retentionDays;
    records = [];
    benchmarkRuns = [];
    telemetryUploadedDays = new Map();
    constructor(options = {}) {
        this.enabled = options.enabled ?? true;
        this.kind = this.enabled ? "memory" : "off";
        this.retentionDays = options.retentionDays ?? 30;
    }
    initialize() { }
    recordAttempt(record) {
        if (!this.enabled)
            return;
        this.records.push({ ...record });
    }
    getUsageSummary(filter = {}) {
        if (!this.enabled)
            return { ...EMPTY_USAGE_SUMMARY };
        return summarizeAttempts(this.filtered(filter));
    }
    getTransportSummary(filter = {}) {
        if (!this.enabled)
            return { ...EMPTY_TRANSPORT_SUMMARY };
        return summarizeTransportFromAttempts(this.filtered(filter));
    }
    getStatus() {
        return {
            kind: this.kind,
            detailRows: this.enabled ? this.records.length : 0,
            rollupRows: 0,
            benchmarkRows: this.enabled ? this.benchmarkRuns.length : 0,
            degraded: false,
        };
    }
    runCleanup(now, force = false) {
        if (!this.enabled)
            return {
                attemptsDeleted: 0,
                rollupsDeleted: 0,
                benchmarksDeleted: 0,
                ran: false,
            };
        const cutoff = now - this.retentionDays * 86_400_000;
        const before = this.records.length;
        this.records = this.records.filter((record) => record.occurredAt >= cutoff);
        return {
            attemptsDeleted: before - this.records.length,
            rollupsDeleted: 0,
            benchmarksDeleted: 0,
            ran: force || before !== this.records.length,
        };
    }
    clearProject(projectId) {
        if (!this.enabled)
            return;
        this.records = this.records.filter((record) => record.projectId !== projectId);
    }
    clearDetails() {
        this.records = [];
    }
    clearBenchmarks() {
        this.benchmarkRuns = [];
    }
    startBenchmarkRun(manifest) {
        if (!this.enabled)
            return;
        this.benchmarkRuns.push({
            runId: manifest.runId,
            createdAt: manifest.createdAt,
            variant: manifest.variant,
            scenario: manifest.scenario,
            manifest,
        });
    }
    completeBenchmarkRun(runId, report) {
        if (!this.enabled)
            return false;
        const run = this.benchmarkRuns.find((entry) => entry.runId === runId);
        if (!run)
            return false;
        run.completedAt = report.completedAt;
        run.report = report;
        return true;
    }
    listBenchmarkRuns() {
        return this.enabled
            ? this.benchmarkRuns.map((entry) => ({
                ...entry,
                manifest: { ...entry.manifest },
            }))
            : [];
    }
    getBenchmarkRun(runId) {
        const run = this.benchmarkRuns.find((entry) => entry.runId === runId);
        return run
            ? {
                ...run,
                manifest: { ...run.manifest },
                report: run.report ? { ...run.report } : undefined,
            }
            : undefined;
    }
    clearAll() {
        this.records = [];
        this.benchmarkRuns = [];
        this.telemetryUploadedDays.clear();
    }
    exportData(format, filter = {}) {
        return serializeAttempts(this.enabled ? this.filtered(filter) : [], format);
    }
    vacuum() { }
    close() { }
    getAnonymousDailySummary(day) {
        if (!this.enabled)
            return undefined;
        const records = this.records.filter((record) => utcDayFromMs(record.occurredAt) === day);
        if (records.length === 0)
            return undefined;
        return summarizeAnonymousDaily(records);
    }
    listTelemetryDays() {
        if (!this.enabled)
            return [];
        const days = new Set(this.records.map((record) => utcDayFromMs(record.occurredAt)));
        return Array.from(days).sort();
    }
    listPendingTelemetryDays(now = Date.now()) {
        if (!this.enabled)
            return [];
        const today = utcDayFromMs(now);
        return this.listTelemetryDays().filter((day) => day < today && !this.isTelemetryDayUploaded(day));
    }
    isTelemetryDayUploaded(day) {
        if (!this.enabled)
            return false;
        return this.telemetryUploadedDays.has(day);
    }
    markTelemetryDayUploaded(day, uploadedAt) {
        if (!this.enabled)
            return;
        this.telemetryUploadedDays.set(day, uploadedAt);
    }
    filtered(filter) {
        return this.records.filter((record) => {
            if (filter.projectId !== undefined &&
                record.projectId !== filter.projectId)
                return false;
            if (filter.since !== undefined && record.occurredAt < filter.since)
                return false;
            return true;
        });
    }
}
//# sourceMappingURL=memory.js.map