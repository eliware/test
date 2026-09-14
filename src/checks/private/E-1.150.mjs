import { fail, pass } from "../check-result.mjs";

export const ruleId = "E-1.150";

export function run({ packageJson }) {
  if (packageJson?.private !== true)
    return fail(ruleId, "Private repositories must set package.json private to true.");
  return pass(ruleId);
}
