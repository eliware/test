import { fail, pass } from "../check-result.mjs";
import { collectRunbookFiles } from "./E-0.1.2.1.0/collect-runbook-files.mjs";
import { validateRunbookIndexCheck } from "./E-0.1.2.1.0/validate-runbook/index-check.mjs";
import { validateRunbookDocuments } from "./E-0.1.2.1.0/validate-runbook/document-checks.mjs";
import { validateProfileDocumentation } from "../../validation/shared/conventions/validate/profile/documentation.mjs";

export const ruleId = "E-0.1.2.1.0";
export const repositoryInventoryOptions = { expandedDirectories: ["runbooks"] };

export async function run(context = {}, dependencies = {}) {
  const inventory = context.repositoryInventory;
  if (!inventory?.files || !inventory.readText)
    return fail(ruleId, "Repository inventory is required for runbook checks.");
  const errors = await validateProfileDocumentation("workspace", inventory);
  let files;
  try {
    files = await inventory.files("all");
  } catch (error) {
    return fail(ruleId, `Workspace files could not be inspected: ${error.message}`);
  }
  const { runbooks, unsupported } = collectRunbookFiles(files);
  errors.push(...unsupported);
  errors.push(...(await validateRunbookIndexCheck(files, inventory, runbooks)));
  if (runbooks.length)
    errors.push(...(await validateRunbookDocuments(runbooks, inventory, dependencies)));
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
