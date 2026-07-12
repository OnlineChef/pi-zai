import { clampThinkingLevel } from "@earendil-works/pi-ai/compat";
import { computeCacheRatios } from "../cache/metrics.js";
import { resolvePromptStability } from "../prompt-stability.js";
import { getTpsTracker, sessionState } from "../state.js";
import { formatTpsTelemetryLines } from "../telemetry/tps.js";
import { getCacheMetricsStore } from "./cache-state.js";
import { describeClearThinking, describePreservedThinking, describeThinkingPayload, formatCredentialSource, formatDollarCost, formatPercent, formatUsageLine, getEndpointLabel, getLastAssistantUsage, getSessionUsageTotals, getZaiCompat, requireZaiModel, } from "./helpers.js";
export function registerZaiStatusCommand(pi, deps) {
    pi.registerCommand("zai", {
        description: "Show Z.AI provider status, thinking, cache, and usage",
        handler: async (_args, ctx) => {
            const check = requireZaiModel(ctx);
            if ("error" in check) {
                ctx.ui.notify(check.error, "warning");
                return;
            }
            const model = check.model;
            const config = deps.getConfig(ctx.cwd);
            const rawThinkingLevel = pi.getThinkingLevel();
            const thinkingLevel = clampThinkingLevel(model, rawThinkingLevel);
            if (thinkingLevel !== rawThinkingLevel) {
                pi.setThinkingLevel(thinkingLevel);
            }
            const credentialSource = (await deps.resolveCredentialSourceName(model.provider, ctx)) ??
                formatCredentialSource(model.provider, ctx);
            const lastUsage = getLastAssistantUsage(ctx);
            const sessionTotals = getSessionUsageTotals(ctx);
            const cacheStats = getCacheMetricsStore().get();
            const sessionPrompt = sessionTotals.input + sessionTotals.cacheRead + sessionTotals.cacheWrite;
            const sessionHitRatio = sessionPrompt > 0 ? sessionTotals.cacheRead / sessionPrompt : (cacheStats?.rolling.hitRatio ?? 0);
            const lastHitRatio = lastUsage ? computeCacheRatios(lastUsage).hitRatio : cacheStats?.last?.hitRatio;
            const toolStream = getZaiCompat(model)?.zaiToolStream === true ? "enabled" : "disabled";
            const sessionCostLabel = model.provider === "zai-platform" ? formatDollarCost(sessionTotals.cost) : "subscription-managed";
            const promptAnalysis = resolvePromptStability(ctx.getSystemPrompt(), sessionState.promptStability);
            const tpsStats = getTpsTracker().get();
            const lines = [
                "Z.AI status",
                `Extension: @onlinechefgroep/pi-zai ${deps.extensionVersion}`,
                "",
                `Provider: ${model.provider}`,
                `Endpoint: ${getEndpointLabel(model)}`,
                `Model: ${model.id}`,
                rawThinkingLevel === thinkingLevel
                    ? `Thinking: ${thinkingLevel} (Pi native) → ${describeThinkingPayload(config, thinkingLevel, model)}`
                    : `Thinking: ${thinkingLevel} (Pi native; clamped from ${rawThinkingLevel}) → ${describeThinkingPayload(config, thinkingLevel, model)}`,
                `clear_thinking: ${describeClearThinking(config, thinkingLevel, model)}`,
                `Preserved thinking: ${describePreservedThinking(config)}`,
                `Tool streaming: ${toolStream}`,
                `Credential source: ${credentialSource}`,
                "",
                "Last usage",
                lastUsage ? `  ${formatUsageLine(lastUsage)}` : "  none",
                "",
                "Throughput",
                ...formatTpsTelemetryLines(tpsStats),
                "",
                "Cache",
                `  Last request hit ratio: ${lastHitRatio !== undefined ? formatPercent(lastHitRatio) : "n/a"}`,
                `  Session hit ratio: ${formatPercent(sessionHitRatio)}`,
                `  Session cost: ${sessionCostLabel}`,
                "",
                "Prompt stability",
                ...(promptAnalysis
                    ? [
                        `  Stable lines: ${promptAnalysis.stableLineCount}`,
                        `  Volatile lines: ${promptAnalysis.volatileLineCount}`,
                        `  Dynamic marker: ${promptAnalysis.hasDynamicMarker ? "yes" : "no"}`,
                        `  Fingerprint: ${promptAnalysis.systemFingerprint ?? cacheStats?.segment.systemFingerprint ?? "pending"}`,
                    ]
                    : ["  pending (send a Z.AI request first)"]),
            ];
            ctx.ui.notify(lines.join("\n"), "info");
        },
    });
}
//# sourceMappingURL=status.js.map