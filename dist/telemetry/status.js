import { formatTpsStatusLine } from "./tps.js";
const STATUS_KEY = "zai";
export function clearZaiStatus(ctx) {
    if (!ctx.hasUI) {
        return;
    }
    ctx.ui.setStatus(STATUS_KEY, undefined);
}
export function updateZaiTpsStatus(ctx, config, sample, stats) {
    if (!ctx.hasUI || config.statusTps === false || !sample || sample.tps <= 0) {
        return;
    }
    ctx.ui.setStatus(STATUS_KEY, formatTpsStatusLine(sample, stats.rolling, config.statusTpsAvg === true));
}
//# sourceMappingURL=status.js.map