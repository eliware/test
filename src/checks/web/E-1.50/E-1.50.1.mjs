import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.50.1";
export const parentRuleId = "E-1.50";

export async function run({ root, packageJson }) {
  const assetRoot =
    typeof packageJson?.eliware?.webRoot === "string" && packageJson.eliware.webRoot.trim()
      ? packageJson.eliware.webRoot.trim()
      : "public";
  const configuredExclusions = packageJson?.eliware?.webAssetExcludes;
  const exclusions = configuredExclusions === undefined
    ? ["dist", "build", "coverage", "node_modules", ".git"]
    : configuredExclusions;
  if (
    !Array.isArray(exclusions) ||
    exclusions.some((value) => typeof value !== "string" || !value.trim())
  ) {
    return fail(ruleId, "eliware.webAssetExcludes must be a string array when provided.");
  }
  try {
    const entries = await readdir(join(root, assetRoot), { withFileTypes: true, recursive: true });
    const excluded = entries.find((entry) =>
      exclusions.some((value) => entry.name === value || entry.name.includes(value)),
    );
    if (excluded)
      return fail(ruleId, `Web public assets must not include excluded output: ${excluded.name}.`);
  } catch {
    return fail(ruleId, `${assetRoot}/ is required as the web public asset root.`);
  }
  return pass(ruleId);
}
