import { fail, pass } from "../../check-result.mjs";
import { collectWebAssetPaths } from "./collect-web-asset-paths.mjs";
import { matchesWebAssetExclusion } from "./matches-web-asset-exclusion.mjs";
import { resolveWebAssetSettings } from "./resolve-web-asset-settings.mjs";

export const ruleId = "E-0.1.50.1";
export const parentRuleId = "E-0.1.50";

export async function run({ root, packageJson, repositoryInventory }) {
  const settings = resolveWebAssetSettings(root, packageJson);
  if (settings.error) return fail(ruleId, settings.error);
  try {
    const paths = await collectWebAssetPaths(
      settings.resolvedAssets,
      undefined,
      repositoryInventory,
      settings.exclusions,
    );
    const excluded = paths.find((path) =>
      settings.exclusions.some((exclusion) => matchesWebAssetExclusion(path, exclusion)),
    );
    if (excluded)
      return fail(ruleId, `Web public assets must not include excluded output: ${excluded}.`);
  } catch {
    return fail(ruleId, `${settings.assetRoot}/ is required as the web public asset root.`);
  }
  return pass(ruleId);
}
