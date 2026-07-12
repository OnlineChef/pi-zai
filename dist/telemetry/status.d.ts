import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { ZaiConfig } from "../config.ts";
import { type TpsSample, type TpsStats } from "./tps.ts";
export declare function clearZaiStatus(ctx: ExtensionContext): void;
export declare function updateZaiTpsStatus(ctx: ExtensionContext, config: ZaiConfig, sample: TpsSample | undefined, stats: TpsStats): void;
//# sourceMappingURL=status.d.ts.map