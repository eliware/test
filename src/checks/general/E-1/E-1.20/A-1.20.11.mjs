import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.20.11";
export const parentRuleId = "E-1.20";

export function run({ packageJson }) {
  for (const name of ["typecheck", "build"]) {
    if (
      packageJson?.scripts?.[name] !== undefined &&
      (typeof packageJson.scripts[name] !== "string" || !packageJson.scripts[name].trim())
    ) {
      return fail(ruleId, `Declared ${name} validation must be a nonempty npm script.`);
    }
  }
  return pass(ruleId);
}
