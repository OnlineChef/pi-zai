import type { Usage } from "@earendil-works/pi-ai";
import type { ProviderAttemptRecord } from "./storage/types.ts";
export declare class AttemptTracker {
    private inFlight;
    hasInFlight(): boolean;
    /** Start timing at query begin so delta/header marks work even without before_provider_request. */
    prepareQueryAttempt(queryId: string, now?: number): void;
    /** Attach provider request identity after onPayload / before_provider_request. */
    armProviderAttempt(input: {
        requestId: string;
        attempt: number;
        payloadFingerprint: string;
        now?: number;
    }): void;
    beginAttempt(input: {
        queryId: string;
        requestId: string;
        attempt: number;
        payloadFingerprint: string;
        now?: number;
    }): void;
    markHeadersReceived(now?: number): void;
    markFirstDelta(now?: number): void;
    markResponse(status: number, errorCategory?: string): void;
    buildRecord(input: {
        occurredAt?: number;
        projectId: string;
        sessionHash: string;
        provider: string;
        model: string;
        endpointKind: string;
        thinkingLevel?: string;
        extensionVersion: string;
        systemFingerprint?: string;
        toolsetFingerprint?: string;
        usage?: Usage;
        errorCategory?: string;
    }): ProviderAttemptRecord | undefined;
    reset(): void;
}
//# sourceMappingURL=attempt-tracker.d.ts.map