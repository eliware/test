import { fail, pass } from "../../orchestration/check-result.mjs";
import { validateKnitConfiguration } from "./E-0.1.0.1.6/validate-knit-configuration.mjs";

export const ruleId = "E-0.1.0.1.6";
export const enforcementMode = "deterministic";

export async function run(context = {}) {
  const errors = await validateKnitConfiguration(context.repositoryInventory);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
