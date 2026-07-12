export declare function localSecretPath(): string;
export declare function loadOrCreateLocalSecret(): Buffer;
export declare function clearLocalProjectSecret(): void;
/** Local-only project hash; never sent to remote telemetry. */
export declare function projectIdForCwd(cwd: string): string;
//# sourceMappingURL=project-id.d.ts.map