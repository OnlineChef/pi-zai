import { appendFileSync } from "node:fs";
const DEBUG_ENDPOINT = "http://127.0.0.1:7734/ingest/fef2fe23-8ff6-47d6-89f9-c00befcc36b4";
const DEBUG_SESSION = "9b39c5";
const DEBUG_LOG_PATH = "/home/sofie/z.ai/.cursor/debug-9b39c5.log";
export function agentDebugLog(location, message, data, hypothesisId, runId = "pre-fix") {
    const entry = {
        sessionId: DEBUG_SESSION,
        runId,
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
    };
    // #region agent log
    try {
        appendFileSync(DEBUG_LOG_PATH, `${JSON.stringify(entry)}\n`);
    }
    catch { }
    fetch(DEBUG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": DEBUG_SESSION },
        body: JSON.stringify(entry),
    }).catch(() => { });
    // #endregion
}
//# sourceMappingURL=debug-agent-log.js.map