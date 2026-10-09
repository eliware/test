import { fail, pass } from "../check-result.mjs";
import { validateProfileDocumentation } from "../../validation/shared/conventions/validate-profile-documentation.mjs";

export const ruleId = "E-0.1.8.1.0";

export async function run(context = {}) {
  const errors = await validateProfileDocumentation("mcp-server", context.repositoryInventory);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
