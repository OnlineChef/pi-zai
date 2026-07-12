import type { ZaiConfig } from "./config.ts";
import type { UsageSummary } from "./storage/types.ts";
import type { ZaiSessionState } from "./state.ts";
export type PrivacyPreviewSection = {
    title: string;
    lines: string[];
};
export declare function buildAggregateTelemetryPreview(config: ZaiConfig, sessionState: Pick<ZaiSessionState, "provider" | "modelId" | "endpoint" | "promptStability">, usage: UsageSummary): Record<string, unknown>;
export declare function formatPrivacyPreview(config: ZaiConfig, sessionState: Pick<ZaiSessionState, "projectId" | "sessionHash" | "provider" | "modelId" | "endpoint" | "promptStability">, usage: UsageSummary): string;
//# sourceMappingURL=privacy-preview.d.ts.map