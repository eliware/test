import { fail, pass } from "../../orchestration/check-result.mjs";
import { validateApplicationEntrypoints } from "./E-0.1.4.1.1/validate-application-entrypoints.mjs";

export const ruleId = "E-0.1.4.1.1";
export const enforcementMode = "deterministic";

export async function run(context = {}, dependencies = {}) {
  const errors = await validateApplicationEntrypoints(context, dependencies);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
