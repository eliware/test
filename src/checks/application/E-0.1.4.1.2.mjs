import { fail, pass } from "../../orchestration/check-result.mjs";
import { validateApplicationLayout } from "./E-0.1.4.1.2/validate-application-layout.mjs";

export const ruleId = "E-0.1.4.1.2";
export const enforcementMode = "deterministic";

export async function run(context = {}) {
  const errors = await validateApplicationLayout(context);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
