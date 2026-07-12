import type { ZaiConfig } from "../config.ts";
import type { MetricsStorage } from "../storage/types.ts";
import type { AggregateTelemetryPayload } from "./types.ts";
export declare function buildAggregatePayloadForDay(input: {
    day: string;
    config: ZaiConfig;
    extensionVersion: string;
    storage: MetricsStorage;
}): AggregateTelemetryPayload | undefined;
//# sourceMappingURL=aggregate.d.ts.map