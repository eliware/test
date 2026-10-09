import { fail, pass } from "../check-result.mjs";

export const ruleId = "E-0.1.12.1.0";

export function run(context = {}) {
  if (context.packageJson?.private !== true)
    return fail(ruleId, "Private repositories must set package.json.private to true.");
  return pass(ruleId);
}
