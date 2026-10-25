import { collectPackedEntrypointTargets } from "./entrypoints/targets.mjs";
import { packedTargetMatches } from "./target-matches.mjs";

export function validatePackedEntrypoints(packageJson, packedPaths) {
  const targets = collectPackedEntrypointTargets(packageJson);
  const missing = targets.filter((target) => !packedTargetMatches(target, packedPaths));
  return missing.length
    ? `npm pack omitted public package entrypoints: ${missing.join(", ")}.`
    : null;
}
