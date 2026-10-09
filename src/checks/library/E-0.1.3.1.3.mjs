import { fail, pass } from "../check-result.mjs";
import { validateApplicationJestPolicy } from "../application/E-0.1.4.1.3/validate-application-jest-policy.mjs";

export const ruleId = "E-0.1.3.1.3";

export async function run(context = {}) {
  if (context.packageJson?.eliware?.apply?.includes("application"))
    return pass(ruleId, "Application checks enforce the shared Jest and coverage policy.");
  const errors = await validateApplicationJestPolicy(context);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
