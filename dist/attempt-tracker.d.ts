import type { Usage } from "@earendil-works/pi-ai";
import type { ProviderAttemptRecord } from "./storage/types.ts";
export declare class AttemptTracker {
    private inFlight;
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