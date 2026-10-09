import { fail, pass } from "../check-result.mjs";
import { validateProfileDocumentation } from "../shared/validate-profile-documentation.mjs";

export const ruleId = "E-0.1.6.1.0";

export async function run({ repositoryInventory } = {}) {
  const errors = await validateProfileDocumentation("web", repositoryInventory);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
