import { getMetricsStorage, sessionState } from "../state.js";
import { projectIdForCwd } from "../storage/project-id.js";
import { formatHeading, formatKeyValue, formatMs, formatSection, joinCommandLines, } from "./format.js";
function formatTransportSummary(summary) {
    const lines = [
        ...formatHeading("Z.AI transport"),
        formatKeyValue("Attempts", summary.attempts),
        formatKeyValue("Errors", summary.errors),
        formatKeyValue("Avg headers", formatMs(summary.avgRequestToHeadersMs)),
        formatKeyValue("Avg first delta", formatMs(summary.avgRequestToFirstDeltaMs)),
        formatKeyValue("Avg first tool", formatMs(summary.avgRequestToFirstToolDeltaMs)),
        formatKeyValue("Avg total", formatMs(summary.avgTotalMs)),
    ];
    if (summary.totalToolCalls > 0) {
        lines.push(formatKeyValue("Tool calls", `${summary.totalToolCalls}${summary.totalToolErrors > 0 ? ` (${summary.totalToolErrors} errors)` : ""}`), formatKeyValue("Avg tool duration", formatMs(summary.avgToolDurationMs)));
    }
    const categories = Object.entries(summary.errorCategories).sort((left, right) => right[1] - left[1]);
    if (categories.length > 0) {
        lines.push(...formatSection("Error categories", categories.map(([category, count]) => `${category}: ${count}`)));
    }
    return joinCommandLines(lines);
}
export function registerZaiTransportCommand(pi) {
    pi.registerCommand("zai-transport", {
        description: "Local transport latency and error-category summary",
        handler: async (_args, ctx) => {
            const storage = getMetricsStorage();
            if (!storage) {
                ctx.ui.notify("Local metrics storage is not initialized.", "warning");
                return;
            }
            const projectId = sessionState.projectId ?? projectIdForCwd(ctx.cwd);
            const summary = storage.getTransportSummary({ projectId });
            ctx.ui.notify(formatTransportSummary(summary), "info");
        },
    });
}
//# sourceMappingURL=transport.js.map