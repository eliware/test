import { isValidSensitiveExemption } from "./validate-sensitive-exemption.mjs";

export function readSensitiveExemptions(packageJson, ruleId) {
  return new Set(
    (packageJson?.eliware?.exempt ?? [])
      .filter((entry) => entry.ruleId === ruleId && isValidSensitiveExemption(entry))
      .map((entry) => entry.path.replaceAll("\\", "/")),
  );
}
