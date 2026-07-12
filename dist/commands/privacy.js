import { formatPrivacyPreview } from "../privacy-preview.js";
import { getMetricsStorage, sessionState } from "../state.js";
import { EMPTY_USAGE_SUMMARY } from "../storage/types.js";
const ACTIONS = ["preview"];
export function registerZaiPrivacyCommand(pi, deps) {
    pi.registerCommand("zai-privacy", {
        description: "Local privacy allowlist and future aggregate preview (not sent)",
        getArgumentCompletions: (prefix) => {
            const matches = ACTIONS.filter((value) => value.startsWith(prefix));
            return matches.length > 0 ? matches.map((value) => ({ value, label: value })) : null;
        },
        handler: async (args, ctx) => {
            const action = args.trim().toLowerCase() || "preview";
            if (action !== "preview") {
                ctx.ui.notify(`Unknown action "${action}". Try: ${ACTIONS.join(", ")}`, "warning");
                return;
            }
            const config = deps.getConfig(ctx.cwd);
            const storage = getMetricsStorage();
            const usage = storage?.getUsageSummary({ projectId: sessionState.projectId }) ?? { ...EMPTY_USAGE_SUMMARY };
            ctx.ui.notify(formatPrivacyPreview(config, sessionState, usage), "info");
        },
    });
}
//# sourceMappingURL=privacy.js.map