import { fail, pass } from "../../check-result.mjs";
import { collectWebAssetPaths } from "./collect-web-asset-paths.mjs";
import { findExcludedWebAssets } from "./find-excluded-web-assets.mjs";
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
    const excluded = findExcludedWebAssets(paths, settings.exclusions);
    if (excluded.length > 0)
      return fail(
        ruleId,
        excluded
          .map((path) => `Web public assets must not include excluded output: ${path}.`)
          .join("\n"),
      );
  } catch {
    return fail(ruleId, `${settings.assetRoot}/ is required as the web public asset root.`);
  }
  return pass(ruleId);
}
