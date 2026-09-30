import { parse, valid } from "semver";
import { fail, pass } from "../../../check-result.mjs";
import { readBundledProfileCatalog } from "../../../../orchestrators/read-bundled-profile-catalog.mjs";
import { validateAppliedProfiles } from "../../../../orchestrators/validate-applied-profiles.mjs";

export const ruleId = "A-0.1.9.1";
export const parentRuleId = "E-0.1.9";

export function run({ packageJson }) {
  if (
    typeof packageJson?.version !== "string" ||
    valid(packageJson.version) !== packageJson.version
  ) {
    return fail(
      ruleId,
      "package.json.version must identify the repository's convention baseline with a valid semver version.",
    );
  }
  const packageVersion = parse(packageJson.version);
  const catalog = readBundledProfileCatalog();
  if (
    packageVersion.prerelease.length > 0 ||
    packageVersion.build.length > 0 ||
    packageVersion.major !== Number(catalog.version.split(".")[0]) ||
    packageVersion.minor !== Number(catalog.version.split(".")[1])
  ) {
    return fail(
      ruleId,
      `package.json.version must use the applied convention MAJOR.MINOR (${catalog.version}) with a numeric PATCH and no prerelease or build suffix.`,
    );
  }
  const apply = packageJson?.eliware?.apply;
  if (
    !Array.isArray(apply) ||
    apply.length === 0 ||
    apply.some((group) => typeof group !== "string" || !group.trim())
  ) {
    return fail(
      ruleId,
      "package.json.eliware.apply must identify the selected convention documents.",
    );
  }
  const failure = validateAppliedProfiles(apply, catalog);
  return failure ? fail(ruleId, failure) : pass(ruleId);
}
