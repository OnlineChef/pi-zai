import { buildAggregatePayloadForDay } from "./aggregate.js";
import { hasTelemetryConsent } from "./consent.js";
import { TELEMETRY_INGEST_URL } from "./types.js";
import { uploadAggregatePayload } from "./uploader.js";
export function isTelemetryUploadEnabled(config) {
    return config.telemetryMode === "aggregate" && hasTelemetryConsent();
}
export function resolveTelemetryIngestUrl(config) {
    return config.telemetryIngestUrl ?? TELEMETRY_INGEST_URL;
}
export async function uploadTelemetryDay(input) {
    if (!isTelemetryUploadEnabled(input.config)) {
        return {
            day: input.day,
            ok: false,
            error: "telemetry not enabled (set mode aggregate and /zai-telemetry enable)",
        };
    }
    if (input.storage.isTelemetryDayUploaded(input.day)) {
        return { day: input.day, ok: true, error: "already uploaded" };
    }
    const payload = buildAggregatePayloadForDay(input);
    if (!payload) {
        return { day: input.day, ok: false, error: "no aggregate data for day" };
    }
    const result = await uploadAggregatePayload(payload, resolveTelemetryIngestUrl(input.config));
    if (result.ok) {
        input.storage.markTelemetryDayUploaded(input.day, Date.now());
    }
    return result;
}
export async function syncPendingTelemetry(input) {
    const now = input.now ?? Date.now();
    const uploaded = [];
    const skipped = [];
    if (!isTelemetryUploadEnabled(input.config)) {
        return { uploaded, skipped };
    }
    for (const day of input.storage.listPendingTelemetryDays(now)) {
        const result = await uploadTelemetryDay({ ...input, day });
        if (result.ok && result.error !== "already uploaded") {
            uploaded.push(result);
        }
        else if (!result.ok) {
            skipped.push(`${day}: ${result.error ?? "failed"}`);
        }
    }
    return { uploaded, skipped };
}
//# sourceMappingURL=sync.js.map