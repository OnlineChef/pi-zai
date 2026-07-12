export type PromptStabilityMode = "off" | "observe" | "safe";
export type SessionAffinityMode = "off" | "observe" | "experimental";
export type MetricsMode = "off" | "memory" | "local";
export type TelemetryMode = "off";
export interface ZaiMetricsSettings {
    mode?: MetricsMode;
    retentionDays?: number;
    rollupRetentionDays?: number;
    maxDatabaseBytes?: number;
}
export interface ZaiPromptStabilitySettings {
    mode?: PromptStabilityMode;
}
export interface ZaiTelemetrySettings {
    mode?: TelemetryMode;
}
export interface ZaiSettings {
    preserveThinking?: boolean;
    statusTps?: boolean;
    statusTpsAvg?: boolean;
    promptStability?: ZaiPromptStabilitySettings;
    sessionAffinity?: SessionAffinityMode;
    metrics?: ZaiMetricsSettings;
    telemetry?: ZaiTelemetrySettings;
}
export interface ZaiMetricsConfig {
    mode: MetricsMode;
    retentionDays: number;
    rollupRetentionDays: number;
    maxDatabaseBytes: number;
}
export interface ZaiConfig {
    preserveThinking: boolean;
    statusTps: boolean;
    statusTpsAvg: boolean;
    promptStabilityMode: PromptStabilityMode;
    sessionAffinity: SessionAffinityMode;
    metrics: ZaiMetricsConfig;
    telemetryMode: TelemetryMode;
}
export declare function loadZaiConfig(cwd?: string): ZaiConfig;
//# sourceMappingURL=config.d.ts.map