import { analyzeSystemPromptSections, canonicalStableSystemPrefix, fingerprintSystemPrompt, } from "./cache/index.js";
export function snapshotPromptStability(systemPrompt) {
    const stablePrefix = canonicalStableSystemPrefix(systemPrompt);
    const analysis = analyzeSystemPromptSections(systemPrompt);
    return {
        stableLineCount: analysis.stableLineCount,
        volatileLineCount: analysis.volatileLineCount,
        hasDynamicMarker: analysis.hasDynamicMarker,
        systemFingerprint: fingerprintSystemPrompt(stablePrefix),
    };
}
/** Use cached hook snapshot, or compute live from Pi's current system prompt. */
export function resolvePromptStability(systemPrompt, cached) {
    if (cached)
        return cached;
    if (!systemPrompt || systemPrompt.trim().length === 0)
        return undefined;
    return snapshotPromptStability(systemPrompt);
}
//# sourceMappingURL=prompt-stability.js.map