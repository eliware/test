import { fail, pass } from "../../../check-result.mjs";
import { findJestConfigFiles } from "./find-jest-config-files.mjs";

export const ruleId = "E-1.20.7";
export const parentRuleId = "E-1.20";

export async function run({ root, packageJson }) {
  if (
    !packageJson?.jest ||
    typeof packageJson.jest !== "object" ||
    Array.isArray(packageJson.jest)
  ) {
    return fail(ruleId, "Jest configuration must be declared in package.json.");
  }
  try {
    const configs = await findJestConfigFiles(root);
    if (configs.length > 0)
      return fail(
        ruleId,
        "Jest configuration must live in package.json; found separate config files.",
      );
  } catch (error) {
    return fail(ruleId, `Jest configuration files could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
