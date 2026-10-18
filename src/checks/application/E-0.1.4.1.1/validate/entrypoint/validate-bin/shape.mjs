import { isValidBinTarget } from "./target.mjs";

export function validateBinShape(bin) {
  if (bin === undefined) return [];
  if (typeof bin === "string") {
    return isValidBinTarget(bin) ? [] : ["package.json bin must be a nonempty path string."];
  }
  if (!bin || typeof bin !== "object" || Array.isArray(bin)) {
    return ["package.json bin must be a path or a command map."];
  }
  return [];
}
