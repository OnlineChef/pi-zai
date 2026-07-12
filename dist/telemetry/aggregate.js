import { bucketCount } from "./buckets.js";
export function buildAggregatePayloadForDay(input) {
    const summary = input.storage.getAnonymousDailySummary(input.day);
    if (!summary || summary.attempts === 0)
        return undefined;
    const totalPrompt = summary.inputTokens + summary.cacheReadTokens + summary.cacheWriteTokens;
    const cacheHitRatio = totalPrompt > 0 ? summary.cacheReadTokens / totalPrompt : 0;
    return {
        schema: 1,
        day: input.day,
        extensionVersion: input.extensionVersion,
        promptMode: input.config.promptStabilityMode,
        attempts: summary.attempts,
        errors: summary.errors,
        inputTokens: summary.inputTokens,
        cacheReadTokens: summary.cacheReadTokens,
        cacheWriteTokens: summary.cacheWriteTokens,
        outputTokens: summary.outputTokens,
        turnBucket: bucketCount(summary.attempts, [0, 5, 20, 50, 100]),
        cacheRatioBucket: bucketCount(Math.round(cacheHitRatio * 100), [0, 25, 50, 75, 90, 100]),
        retryRateBucket: bucketCount(summary.errors, [0, 2, 5, 10]),
        byProviderModel: summary.byProviderModel,
        errorCategories: summary.errorCategories,
    };
}
//# sourceMappingURL=aggregate.js.map