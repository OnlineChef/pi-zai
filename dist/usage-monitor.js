/**
 * Z.AI Coding Plan usage/quota monitor.
 *
 * Uses the (unofficial but stable) monitor endpoints consumed by Z.AI's own
 * coding plugins. Baseline Pi has no visibility into subscription quota; this
 * surfaces the 5-hour / weekly token windows and monthly MCP tool budget.
 */
const UNIT_NAMES = { 3: "Hour", 5: "Month", 6: "Week" };
const LEVEL_LABELS = {
    lite: "Lite",
    standard: "Pro",
    pro: "Pro",
    max: "Max",
};
/** Derive the monitor base (scheme + host) from a model baseUrl. */
export function monitorBaseFromModelUrl(baseUrl) {
    try {
        return new URL(baseUrl).origin;
    }
    catch {
        return undefined;
    }
}
function normalizeHeaders(headers) {
    const out = {
        "Accept-Language": "en-US,en",
        "Content-Type": "application/json",
    };
    if (!headers)
        return out;
    for (const [key, value] of Object.entries(headers)) {
        if (value !== null && value !== undefined && value.length > 0) {
            out[key] = value;
        }
    }
    return out;
}
function authorizationSchemes(apiKey, headers) {
    const existing = headers.Authorization ?? headers.authorization;
    const schemes = new Set();
    if (existing)
        schemes.add(existing);
    schemes.add(apiKey);
    schemes.add(`Bearer ${apiKey}`);
    return [...schemes];
}
async function sleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}
async function fetchQuotaOnce(url, headers, timeoutMs) {
    const response = await fetch(url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` };
    }
    const body = (await response.json());
    if (!body?.success || !body.data || !Array.isArray(body.data.limits)) {
        return { ok: false, error: body?.msg ?? "Unexpected quota response shape" };
    }
    return { ok: true, data: body.data };
}
export async function fetchQuotaLimit(monitorBase, apiKey, options = {}) {
    const url = `${monitorBase}/api/monitor/usage/quota/limit`;
    const retries = options.retries ?? 3;
    const retryDelayMs = options.retryDelayMs ?? 1500;
    const timeoutMs = options.timeoutMs ?? 20_000;
    const baseHeaders = normalizeHeaders(options.headers);
    const schemes = authorizationSchemes(apiKey, baseHeaders);
    let lastError = "unknown error";
    for (const authorization of schemes) {
        const headers = { ...baseHeaders, Authorization: authorization };
        for (let attempt = 0; attempt < retries; attempt += 1) {
            try {
                const result = await fetchQuotaOnce(url, headers, timeoutMs);
                if (result.ok)
                    return result;
                lastError = result.error;
            }
            catch (error) {
                const cause = error instanceof Error &&
                    "cause" in error &&
                    error.cause instanceof Error
                    ? error.cause.message
                    : undefined;
                lastError = cause
                    ? `${error instanceof Error ? error.message : "fetch failed"} (${cause})`
                    : error instanceof Error
                        ? error.message
                        : "fetch failed";
            }
            if (attempt + 1 < retries) {
                await sleep(retryDelayMs * (attempt + 1));
            }
        }
    }
    return { ok: false, error: `${lastError} at ${url}` };
}
export function levelLabel(level) {
    return LEVEL_LABELS[level.toLowerCase()] ?? level;
}
function windowLabel(entry) {
    const unit = UNIT_NAMES[entry.unit] ?? "Window";
    const plural = entry.number > 1 ? "s" : "";
    const scope = entry.type === "TIME_LIMIT" ? "MCP tools" : "tokens";
    return `${entry.number}-${unit}${plural} ${scope}`;
}
export function formatResetCountdown(nextResetTime, now = Date.now()) {
    if (!nextResetTime)
        return "";
    const diffMs = nextResetTime - now;
    if (diffMs <= 0)
        return "reset soon";
    const mins = Math.floor(diffMs / 60_000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 60)
        return `reset in ${mins}m`;
    if (hours < 24)
        return `reset in ${hours}h ${mins % 60}m`;
    return `reset in ${days}d ${hours % 24}h`;
}
function bar(percentage, width = 20) {
    const clamped = Math.max(0, Math.min(100, percentage));
    const filled = Math.round((clamped / 100) * width);
    return `${"#".repeat(filled)}${"-".repeat(width - filled)}`;
}
export function formatQuotaLimit(data, now = Date.now()) {
    const lines = [`Coding Plan quota (${levelLabel(data.level)})`];
    for (const entry of data.limits) {
        const label = windowLabel(entry).padEnd(20);
        const reset = formatResetCountdown(entry.nextResetTime, now);
        if (entry.type === "TIME_LIMIT") {
            const used = entry.currentValue ?? 0;
            const cap = entry.usage ?? 0;
            lines.push(`  ${label} ${used}/${cap} (${entry.percentage}%) ${bar(entry.percentage)} ${reset}`.trimEnd());
            if (entry.usageDetails?.length) {
                const detail = entry.usageDetails
                    .map((d) => `${d.modelCode}: ${d.usage}`)
                    .join(" · ");
                lines.push(`    ${detail}`);
            }
        }
        else {
            lines.push(`  ${label} ${entry.percentage}% ${bar(entry.percentage)} ${reset}`.trimEnd());
        }
    }
    return lines;
}
//# sourceMappingURL=usage-monitor.js.map