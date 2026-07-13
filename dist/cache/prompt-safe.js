import { appendDynamicContext, DYNAMIC_CONTEXT_MARKER, isVolatileSystemPromptLine, splitStableAndDynamicSystemPrompt, } from "./context-policy.js";
/** Normalize dynamic suffix placement when the explicit marker is present. Idempotent. */
export function applySafePromptNormalization(systemPrompt) {
    if (!systemPrompt.includes("--- dynamic context ---")) {
        return undefined;
    }
    const { stable, dynamic } = splitStableAndDynamicSystemPrompt(systemPrompt);
    const stableLines = stable.split("\n");
    const keptStable = [];
    const movedVolatile = [];
    for (const line of stableLines) {
        if (isVolatileSystemPromptLine(line)) {
            movedVolatile.push(line);
        }
        else {
            keptStable.push(line);
        }
    }
    const stablePart = keptStable.join("\n").trimEnd();
    const dynamicBody = [dynamic.trim(), movedVolatile.join("\n").trim()]
        .filter((part) => part.length > 0)
        .join("\n");
    const normalized = dynamicBody.length > 0
        ? appendDynamicContext(stablePart, dynamicBody)
        : stablePart;
    if (normalized === systemPrompt) {
        return undefined;
    }
    return normalized;
}
export function hasDynamicContextMarker(systemPrompt) {
    return systemPrompt.includes(DYNAMIC_CONTEXT_MARKER);
}
//# sourceMappingURL=prompt-safe.js.map