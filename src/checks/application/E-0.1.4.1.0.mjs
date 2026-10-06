import { fail, pass } from "../../orchestration/check-result.mjs";
import { validateApplicationDocumentation } from "./E-0.1.4.1.0/validate-application-documentation.mjs";

export const ruleId = "E-0.1.4.1.0";
export const enforcementMode = "deterministic";

export async function run(context = {}) {
  const errors = await validateApplicationDocumentation(context);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
