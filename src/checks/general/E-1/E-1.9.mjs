import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.9";
export const parentRuleId = "E-1";

export function run({ packageJson }) {
  const metadata = packageJson?.eliware;
  if (!metadata || typeof metadata !== "object") {
    return fail(ruleId, "package.json must contain an eliware metadata object.");
  }
  for (const field of ["apply", "authority", "crosslinks"]) {
    if (!(field in metadata)) return fail(ruleId, `package.json.eliware.${field} is required.`);
  }
  return pass(ruleId);
}
