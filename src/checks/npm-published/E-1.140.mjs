import { fail, pass } from "../check-result.mjs";

export const ruleId = "E-1.140";

export function run({ packageJson }) {
  if (packageJson?.private !== false)
    return fail(ruleId, "Public npm repositories must set package.json.private to false.");
  if (packageJson?.publishConfig?.access !== "public")
    return fail(ruleId, "Public npm repositories must set publishConfig.access to public.");
  return pass(ruleId);
}
