export type TelemetryConsent = {
    schema: 1;
    optedInAt: number;
};
export declare function telemetryConsentPath(): string;
export declare function readTelemetryConsent(): TelemetryConsent | undefined;
export declare function writeTelemetryConsent(now?: number): void;
export declare function clearTelemetryConsent(): void;
export declare function hasTelemetryConsent(): boolean;
//# sourceMappingURL=consent.d.ts.map