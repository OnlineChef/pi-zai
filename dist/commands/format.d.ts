/** Shared plain-text formatting for slash-command notify output. */
export declare function formatHeading(title: string): string[];
export declare function formatSection(title: string, body: string[]): string[];
export declare function formatKeyValue(label: string, value: string | number | undefined, width?: number): string;
export declare function formatBytes(bytes: number | undefined): string;
export declare function formatMs(value: number | undefined): string;
export declare function joinCommandLines(lines: string[]): string;
//# sourceMappingURL=format.d.ts.map