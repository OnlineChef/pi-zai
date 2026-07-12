export const EMPTY_USAGE_SUMMARY = {
    attempts: 0,
    errors: 0,
    inputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    outputTokens: 0,
    estimatedApiCostMicrousd: 0,
    cacheHitRatio: 0,
};
export const EMPTY_TRANSPORT_SUMMARY = {
    attempts: 0,
    errors: 0,
    errorCategories: {},
};
function averageLatency(values) {
    const samples = values.filter((value) => value !== undefined && Number.isFinite(value));
    if (samples.length === 0)
        return undefined;
    return Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length);
}
export function summarizeTransportFromAttempts(records) {
    if (records.length === 0)
        return { ...EMPTY_TRANSPORT_SUMMARY };
    const usage = summarizeAttempts(records);
    const errorCategories = {};
    for (const record of records) {
        if (!record.errorCategory)
            continue;
        errorCategories[record.errorCategory] = (errorCategories[record.errorCategory] ?? 0) + 1;
    }
    return {
        attempts: usage.attempts,
        errors: usage.errors,
        avgRequestToHeadersMs: averageLatency(records.map((record) => record.requestToHeadersMs)),
        avgRequestToFirstDeltaMs: averageLatency(records.map((record) => record.requestToFirstDeltaMs)),
        avgTotalMs: averageLatency(records.map((record) => record.totalMs)),
        errorCategories,
    };
}
export function summarizeAttempts(records) {
    if (records.length === 0)
        return { ...EMPTY_USAGE_SUMMARY };
    let errors = 0;
    let inputTokens = 0;
    let cacheReadTokens = 0;
    let cacheWriteTokens = 0;
    let outputTokens = 0;
    let estimatedApiCostMicrousd = 0;
    let firstOccurredAt = Number.POSITIVE_INFINITY;
    let lastOccurredAt = 0;
    for (const record of records) {
        if (record.errorCategory || (record.httpStatus !== undefined && record.httpStatus >= 400))
            errors += 1;
        inputTokens += record.inputTokens ?? 0;
        cacheReadTokens += record.cacheReadTokens ?? 0;
        cacheWriteTokens += record.cacheWriteTokens ?? 0;
        outputTokens += record.outputTokens ?? 0;
        estimatedApiCostMicrousd += record.estimatedApiCostMicrousd ?? 0;
        firstOccurredAt = Math.min(firstOccurredAt, record.occurredAt);
        lastOccurredAt = Math.max(lastOccurredAt, record.occurredAt);
    }
    const totalPrompt = inputTokens + cacheReadTokens + cacheWriteTokens;
    return {
        attempts: records.length,
        errors,
        inputTokens,
        cacheReadTokens,
        cacheWriteTokens,
        outputTokens,
        estimatedApiCostMicrousd,
        cacheHitRatio: totalPrompt > 0 ? cacheReadTokens / totalPrompt : 0,
        firstOccurredAt,
        lastOccurredAt,
    };
}
const EXPORT_COLUMNS = [
    "occurredAt",
    "projectId",
    "sessionHash",
    "queryId",
    "requestId",
    "attempt",
    "provider",
    "model",
    "endpointKind",
    "thinkingLevel",
    "piVersion",
    "extensionVersion",
    "systemFingerprint",
    "toolsetFingerprint",
    "payloadFingerprint",
    "inputTokens",
    "cacheReadTokens",
    "cacheWriteTokens",
    "outputTokens",
    "requestToHeadersMs",
    "requestToFirstDeltaMs",
    "totalMs",
    "httpStatus",
    "errorCategory",
    "estimatedApiCostMicrousd",
];
function csvCell(value) {
    if (value === undefined || value === null)
        return "";
    const text = String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
export function serializeAttempts(records, format) {
    if (format === "json") {
        return `${JSON.stringify({ schema: 1, attempts: records }, null, 2)}\n`;
    }
    const lines = [EXPORT_COLUMNS.join(",")];
    for (const record of records) {
        lines.push(EXPORT_COLUMNS.map((column) => csvCell(record[column])).join(","));
    }
    return `${lines.join("\n")}\n`;
}
//# sourceMappingURL=types.js.map