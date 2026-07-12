import type { ZaiConfig } from "../config.ts";
import type { MetricsStorage } from "../storage/types.ts";
import { type TelemetrySyncResult, type TelemetryUploadResult } from "./types.ts";
export declare function isTelemetryUploadEnabled(config: ZaiConfig): boolean;
export declare function resolveTelemetryIngestUrl(config: ZaiConfig): string;
export declare function uploadTelemetryDay(input: {
    day: string;
    config: ZaiConfig;
    extensionVersion: string;
    storage: MetricsStorage;
}): Promise<TelemetryUploadResult>;
export declare function syncPendingTelemetry(input: {
    config: ZaiConfig;
    extensionVersion: string;
    storage: MetricsStorage;
    now?: number;
}): Promise<TelemetrySyncResult>;
//# sourceMappingURL=sync.d.ts.map