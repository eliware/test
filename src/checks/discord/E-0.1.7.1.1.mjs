import { fail, pass } from "../check-result.mjs";
import { validateProfileDocumentation } from "../shared/validate-profile-documentation.mjs";

export const ruleId = "E-0.1.7.1.1";

export async function run(context = {}) {
  const errors = await validateProfileDocumentation("discord", context.repositoryInventory);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
