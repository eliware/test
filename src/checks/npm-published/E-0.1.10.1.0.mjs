import { fail, pass } from "../check-result.mjs";
import { validateProfileDocumentation } from "../shared/validate-profile-documentation.mjs";
import { validateNpmReadmeBadge } from "./E-0.1.10.1.0/validate-npm-readme-badge.mjs";

export const ruleId = "E-0.1.10.1.0";

export async function run(context = {}) {
  const errors = await validateProfileDocumentation("npm-published", context.repositoryInventory);
  try {
    const readme = await context.repositoryInventory.readText("README.md");
    const error = validateNpmReadmeBadge(readme, context.packageJson);
    if (error) errors.push(error);
  } catch (error) {
    errors.push(`README.md could not be read: ${error.message}`);
  }
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
