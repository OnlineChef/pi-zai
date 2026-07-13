import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { MemoryStorage } from "./memory.js";
export { clearLocalProjectSecret, loadOrCreateLocalSecret, localSecretPath, projectIdForCwd, } from "./project-id.js";
export { MemoryStorage } from "./memory.js";
export * from "./types.js";
export function defaultMetricsDatabasePath() {
    return join(getAgentDir(), "state", "pi-zai", "metrics.sqlite3");
}
export async function createMetricsStorage(config, onWarning) {
    if (config.mode === "off")
        return new MemoryStorage({
            enabled: false,
            retentionDays: config.retentionDays,
        });
    if (config.mode === "memory")
        return new MemoryStorage({ retentionDays: config.retentionDays });
    try {
        const { NodeSqliteStorage } = await import("./sqlite.js");
        const storage = new NodeSqliteStorage({
            databasePath: defaultMetricsDatabasePath(),
            retentionDays: config.retentionDays,
            rollupRetentionDays: config.rollupRetentionDays,
            maxDatabaseBytes: config.maxDatabaseBytes,
            onWarning,
        });
        storage.initialize();
        return storage;
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        onWarning?.(`pi-zai could not open local SQLite metrics; using memory-only metrics (${detail}).`);
        return new MemoryStorage({ retentionDays: config.retentionDays });
    }
}
//# sourceMappingURL=index.js.map