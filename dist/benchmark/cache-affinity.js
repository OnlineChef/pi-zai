import { randomUUID } from "node:crypto";
const MODES = ["stable", "none", "rotating"];
export function sessionHeaderForMode(mode, stableId, turn) {
    switch (mode) {
        case "stable":
            return stableId;
        case "none":
            return undefined;
        case "rotating":
            return `rot-${stableId}-t${turn}-${randomUUID()}`;
    }
}
export function buildStablePrefix(nonce, prefixLines) {
    const rules = Array.from({ length: prefixLines }, (_, i) => `Rule ${i} [${nonce}]: keep responses deterministic and terse.`);
    return [`You are a coding assistant (${nonce}).`, ...rules].join("\n");
}
export function warmCacheHitRatio(turns) {
    const warm = turns.slice(1).filter((t) => !t.error);
    if (warm.length === 0)
        return 0;
    const cached = warm.reduce((sum, t) => sum + t.cachedTokens, 0);
    const prompt = warm.reduce((sum, t) => sum + t.promptTokens, 0);
    return prompt > 0 ? cached / prompt : 0;
}
function percentile(sorted, p) {
    if (sorted.length === 0)
        return 0;
    const idx = (sorted.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi)
        return sorted[lo] ?? 0;
    const weight = idx - lo;
    return (sorted[lo] ?? 0) * (1 - weight) + (sorted[hi] ?? 0) * weight;
}
export function summarizeMode(mode, trials, turnsPerTrial) {
    const trialRatios = trials.map((t) => warmCacheHitRatio(t.turns));
    const sorted = [...trialRatios].sort((a, b) => a - b);
    const warmTurns = trials.flatMap((t) => t.turns.slice(1)).filter((t) => !t.error);
    const cached = warmTurns.reduce((sum, t) => sum + t.cachedTokens, 0);
    const prompt = warmTurns.reduce((sum, t) => sum + t.promptTokens, 0);
    const latencies = trials.flatMap((t) => t.turns.filter((x) => !x.error).map((x) => x.latencyMs));
    const errors = trials.flatMap((t) => t.turns).filter((t) => t.error).length;
    return {
        mode,
        trials: trials.length,
        turnsPerTrial,
        warmTurns: warmTurns.length,
        warmCacheHitRatio: prompt > 0 ? cached / prompt : 0,
        warmCacheHitRatioMedian: percentile(sorted, 0.5),
        warmCacheHitRatioP25: percentile(sorted, 0.25),
        warmCacheHitRatioP75: percentile(sorted, 0.75),
        avgLatencyMs: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
        errors,
        trialRatios,
    };
}
export function pickWinner(summaries) {
    const eligible = summaries.filter((s) => s.warmTurns > 0);
    if (eligible.length < 2)
        return "inconclusive";
    const sorted = [...eligible].sort((a, b) => b.warmCacheHitRatioMedian - a.warmCacheHitRatioMedian);
    const best = sorted[0];
    const second = sorted[1];
    if (!best || !second)
        return "inconclusive";
    // Require at least 5 percentage points median gap to call a winner.
    if (best.warmCacheHitRatioMedian - second.warmCacheHitRatioMedian < 0.05) {
        return "inconclusive";
    }
    return best.mode;
}
export function buildReport(config, byMode) {
    const summaries = MODES.map((mode) => summarizeMode(mode, byMode.get(mode) ?? [], config.turns));
    return {
        config: {
            baseUrl: config.baseUrl,
            model: config.model,
            trials: config.trials,
            turns: config.turns,
            prefixLines: config.prefixLines,
            retryAttempts: config.retryAttempts,
            retryDelayMs: config.retryDelayMs,
            turnDelayMs: config.turnDelayMs,
            trialDelayMs: config.trialDelayMs,
            timeoutMs: config.timeoutMs,
        },
        summaries,
        winner: pickWinner(summaries),
    };
}
export function formatPercent(ratio) {
    return `${(ratio * 100).toFixed(1)}%`;
}
export function formatReport(report) {
    const lines = [
        "Z.AI cache-affinity A/B benchmark",
        `model=${report.config.model} trials=${report.config.trials} turns=${report.config.turns} prefixLines=${report.config.prefixLines}`,
        "",
        "Warm-turn cache hit (turn 0 excluded; median over trials):",
    ];
    for (const s of report.summaries) {
        lines.push(`  ${s.mode.padEnd(9)} median=${formatPercent(s.warmCacheHitRatioMedian)} p25=${formatPercent(s.warmCacheHitRatioP25)} p75=${formatPercent(s.warmCacheHitRatioP75)} aggregate=${formatPercent(s.warmCacheHitRatio)} errors=${s.errors} avgLatency=${Math.round(s.avgLatencyMs)}ms`);
        lines.push(`             per-trial: ${s.trialRatios.map((r) => formatPercent(r)).join(", ")}`);
    }
    lines.push("");
    lines.push(`Winner: ${report.winner} (>=5pp median gap required)`);
    lines.push("");
    lines.push("Interpretation:");
    lines.push("  stable   = fixed X-Session-Id (pi-zai default)");
    lines.push("  none     = no X-Session-Id (baseline pi)");
    lines.push("  rotating = new X-Session-Id every turn (anti-affinity control)");
    return lines.join("\n");
}
async function sleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}
export async function runSingleTurn(config, system, messages, sessionHeader) {
    const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const started = Date.now();
    for (let attempt = 0; attempt < config.retryAttempts; attempt += 1) {
        try {
            const headers = {
                Authorization: `Bearer ${config.apiKey}`,
                "Content-Type": "application/json",
                "User-Agent": "pi-zai-benchmark/0.1",
            };
            if (sessionHeader) {
                headers["X-Session-Id"] = sessionHeader;
            }
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    model: config.model,
                    messages: [{ role: "system", content: system }, ...messages],
                    max_tokens: 16,
                    stream: false,
                    thinking: { type: "disabled", clear_thinking: true },
                }),
                signal: AbortSignal.timeout(config.timeoutMs),
            });
            if (!response.ok) {
                const err = `HTTP ${response.status}`;
                if (attempt + 1 < config.retryAttempts) {
                    await sleep(config.retryDelayMs * (attempt + 1));
                    continue;
                }
                return {
                    turn: messages.filter((m) => m.role === "user").length - 1,
                    promptTokens: 0,
                    cachedTokens: 0,
                    latencyMs: Date.now() - started,
                    error: err,
                };
            }
            const body = (await response.json());
            const usage = body.usage ?? {};
            return {
                turn: messages.filter((m) => m.role === "user").length - 1,
                promptTokens: usage.prompt_tokens ?? 0,
                cachedTokens: usage.prompt_tokens_details?.cached_tokens ?? 0,
                latencyMs: Date.now() - started,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "unknown error";
            if (attempt + 1 < config.retryAttempts) {
                await sleep(config.retryDelayMs * (attempt + 1));
                continue;
            }
            return {
                turn: messages.filter((m) => m.role === "user").length - 1,
                promptTokens: 0,
                cachedTokens: 0,
                latencyMs: Date.now() - started,
                error: message,
            };
        }
    }
    return { turn: 0, promptTokens: 0, cachedTokens: 0, latencyMs: Date.now() - started, error: "exhausted retries" };
}
export async function runTrial(config, mode, trialIndex) {
    const nonce = `${mode}-trial${trialIndex}-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const system = buildStablePrefix(nonce, config.prefixLines);
    const stableId = `pi-ab-${nonce}`;
    const messages = [];
    const turns = [];
    for (let turn = 0; turn < config.turns; turn += 1) {
        messages.push({ role: "user", content: `Turn ${turn}: name one sorting algorithm in <=3 words.` });
        const header = sessionHeaderForMode(mode, stableId, turn);
        const result = await runSingleTurn(config, system, messages, header);
        turns.push({ ...result, turn });
        messages.push({ role: "assistant", content: "quicksort" });
        if (config.turnDelayMs > 0 && turn + 1 < config.turns) {
            await sleep(config.turnDelayMs);
        }
    }
    return { mode, trial: trialIndex, nonce, turns };
}
export async function runCacheAffinityBenchmark(config) {
    const byMode = new Map();
    for (const mode of MODES) {
        const trials = [];
        for (let i = 0; i < config.trials; i += 1) {
            trials.push(await runTrial(config, mode, i + 1));
            if (config.trialDelayMs > 0 && i + 1 < config.trials) {
                await sleep(config.trialDelayMs);
            }
        }
        byMode.set(mode, trials);
    }
    return buildReport(config, byMode);
}
export function loadBenchmarkConfigFromEnv(env = process.env) {
    const apiKey = env.ZAI_API_KEY ?? env.ZAI_CODING_API_KEY;
    if (!apiKey) {
        return { error: "Set ZAI_API_KEY or ZAI_CODING_API_KEY" };
    }
    return {
        baseUrl: env.PI_ZAI_AB_BASE_URL ?? "https://api.z.ai/api/coding/paas/v4",
        apiKey,
        model: env.PI_ZAI_AB_MODEL ?? "glm-4.6",
        trials: Number(env.PI_ZAI_AB_TRIALS ?? "5"),
        turns: Number(env.PI_ZAI_AB_TURNS ?? "6"),
        prefixLines: Number(env.PI_ZAI_AB_PREFIX_LINES ?? "400"),
        retryAttempts: Number(env.PI_ZAI_AB_RETRY ?? "4"),
        retryDelayMs: Number(env.PI_ZAI_AB_RETRY_DELAY_MS ?? "2000"),
        turnDelayMs: Number(env.PI_ZAI_AB_TURN_DELAY_MS ?? "800"),
        trialDelayMs: Number(env.PI_ZAI_AB_TRIAL_DELAY_MS ?? "1500"),
        timeoutMs: Number(env.PI_ZAI_AB_TIMEOUT_MS ?? "45000"),
    };
}
//# sourceMappingURL=cache-affinity.js.map