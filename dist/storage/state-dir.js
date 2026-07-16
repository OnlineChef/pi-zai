import { chmodSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
export function getPiZaiStateDir() {
    const directory = join(getAgentDir(), "state", "pi-zai");
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    try {
        chmodSync(directory, 0o700);
    }
    catch {
        // Best-effort on platforms that ignore POSIX modes.
    }
    return directory;
}
//# sourceMappingURL=state-dir.js.map