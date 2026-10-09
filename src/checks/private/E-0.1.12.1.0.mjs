import { fail, pass } from "../check-result.mjs";
import { validateProfileDocumentation } from "../shared/validate-profile-documentation.mjs";

export const ruleId = "E-0.1.12.1.0";

export function run(context = {}) {
  return validate(context);
}

async function validate(context) {
  const errors = await validateProfileDocumentation("private", context.repositoryInventory);
  if (context.packageJson?.private !== true)
    errors.push("Private repositories must set package.json.private to true.");
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
