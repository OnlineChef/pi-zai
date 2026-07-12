import { isZaiModel } from "./cache/context-policy.js";
/** True when the active model uses Pi's native Z.AI providers. */
export function isNativeZaiModel(model) {
    return isZaiModel(model);
}
//# sourceMappingURL=native-zai.js.map