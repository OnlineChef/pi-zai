export type BenchmarkVariantId = "A0" | "A1" | "A2" | "A3";
export type BenchmarkScenarioId = "stable-conversation" | "explicit-dynamic-context" | "tool-drift" | "real-coding-session" | "controlled-failure";
export type BenchmarkVariant = {
    id: BenchmarkVariantId;
    label: string;
    description: string;
    extensionLoaded: boolean;
    settings: Record<string, unknown>;
};
export type BenchmarkScenario = {
    id: BenchmarkScenarioId;
    label: string;
    turns: number;
    description: string;
};
export declare const BENCHMARK_VARIANTS: readonly BenchmarkVariant[];
export declare const BENCHMARK_SCENARIOS: readonly BenchmarkScenario[];
export declare const BENCHMARK_SAMPLE_GATES: {
    readonly sessionsPerVariantScenario: 5;
    readonly turnsPerSession: 12;
    readonly minTurnsPerVariant: 60;
    readonly minTotalTurnsA0A3: 240;
    readonly medianGapForAffinity: 0.05;
};
export declare function findBenchmarkVariant(id: string): BenchmarkVariant | undefined;
export declare function findBenchmarkScenario(id: string): BenchmarkScenario | undefined;
export declare function formatBenchmarkManifest(): string;
export declare function formatBenchmarkInstructions(variantId: string, scenarioId?: string): string;
//# sourceMappingURL=manifest.d.ts.map