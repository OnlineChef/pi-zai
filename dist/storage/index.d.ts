import type { ZaiMetricsConfig } from "../config.ts";
export { clearLocalProjectSecret, loadOrCreateLocalSecret, localSecretPath, projectIdForCwd } from "./project-id.ts";
import type { MetricsStorage } from "./types.ts";
export { MemoryStorage } from "./memory.ts";
export * from "./types.ts";
export declare function defaultMetricsDatabasePath(): string;
export declare function createMetricsStorage(config: ZaiMetricsConfig, onWarning?: (message: string) => void): Promise<MetricsStorage>;
//# sourceMappingURL=index.d.ts.map