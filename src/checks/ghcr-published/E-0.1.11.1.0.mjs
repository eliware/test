import { fail, pass } from "../check-result.mjs";
import { validateGhcrAgentsSection } from "./E-0.1.11.1.0/validate-ghcr-agents-section.mjs";

export const ruleId = "E-0.1.11.1.0";

export async function run(context = {}) {
  const errors = await validateGhcrAgentsSection(context.repositoryInventory, context.packageJson);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
