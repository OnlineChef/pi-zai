export function normalizeZaiThinkingPayload(payload, config) {
    if (payload === null || typeof payload !== "object") {
        return undefined;
    }
    const record = payload;
    const thinking = record.thinking;
    if (!thinking || typeof thinking !== "object") {
        return undefined;
    }
    if (thinking.type === "enabled") {
        const clearThinking = !config.preserveThinking;
        if (thinking.clear_thinking === clearThinking) {
            return undefined;
        }
        return {
            ...record,
            thinking: { ...thinking, clear_thinking: clearThinking },
        };
    }
    if (thinking.type === "disabled" && thinking.clear_thinking !== true) {
        return {
            ...record,
            thinking: { ...thinking, clear_thinking: true },
        };
    }
    return undefined;
}
//# sourceMappingURL=payload-normalizer.js.map