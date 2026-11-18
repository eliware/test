import fail from "../check-result/fail.mjs";
import pass from "../check-result.mjs";
import validateApplicationJestPolicy from "./E-0.1.4.1.3/validate/application/jest-policy.mjs";
export const ruleId = "E-0.1.4.1.3";
export default async function run(context = {}) {
  const errors = await validateApplicationJestPolicy(context);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
