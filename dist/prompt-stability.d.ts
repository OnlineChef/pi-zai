import type { ZaiSessionState } from "./state.ts";
export type PromptStabilitySnapshot = NonNullable<ZaiSessionState["promptStability"]>;
export declare function snapshotPromptStability(systemPrompt: string): PromptStabilitySnapshot;
/** Use cached hook snapshot, or compute live from Pi's current system prompt. */
export declare function resolvePromptStability(systemPrompt: string | undefined, cached: PromptStabilitySnapshot | undefined): PromptStabilitySnapshot | undefined;
//# sourceMappingURL=prompt-stability.d.ts.map