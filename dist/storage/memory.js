import { EMPTY_TRANSPORT_SUMMARY, EMPTY_USAGE_SUMMARY, serializeAttempts, summarizeAttempts, summarizeTransportFromAttempts, } from "./types.js";
export class MemoryStorage {
    kind;
    enabled;
    retentionDays;
    records = [];
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
            benchmarkRows: 0,
            degraded: false,
        };
    }
    runCleanup(now, force = false) {
        if (!this.enabled)
            return { attemptsDeleted: 0, rollupsDeleted: 0, benchmarksDeleted: 0, ran: false };
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
    clearBenchmarks() { }
    clearAll() {
        this.records = [];
    }
    exportData(format, filter = {}) {
        return serializeAttempts(this.enabled ? this.filtered(filter) : [], format);
    }
    vacuum() { }
    close() { }
    filtered(filter) {
        return this.records.filter((record) => {
            if (filter.projectId !== undefined && record.projectId !== filter.projectId)
                return false;
            if (filter.since !== undefined && record.occurredAt < filter.since)
                return false;
            return true;
        });
    }
}
//# sourceMappingURL=memory.js.map