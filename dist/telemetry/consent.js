import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getPiZaiStateDir } from "../storage/state-dir.js";
export function telemetryConsentPath() {
    return join(getPiZaiStateDir(), "telemetry.consent.json");
}
export function readTelemetryConsent() {
    const path = telemetryConsentPath();
    if (!existsSync(path))
        return undefined;
    try {
        const parsed = JSON.parse(readFileSync(path, "utf-8"));
        return parsed?.schema === 1 && typeof parsed.optedInAt === "number"
            ? parsed
            : undefined;
    }
    catch {
        return undefined;
    }
}
export function writeTelemetryConsent(now = Date.now()) {
    const path = telemetryConsentPath();
    writeFileSync(path, `${JSON.stringify({ schema: 1, optedInAt: now }, null, 2)}\n`, "utf-8");
}
export function clearTelemetryConsent() {
    const path = telemetryConsentPath();
    if (existsSync(path))
        rmSync(path, { force: true });
}
export function hasTelemetryConsent() {
    return readTelemetryConsent() !== undefined;
}
//# sourceMappingURL=consent.js.map