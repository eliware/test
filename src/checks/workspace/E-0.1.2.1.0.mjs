import { fail, pass } from "../check-result.mjs";
import { collectRunbookFiles } from "./E-0.1.2.1.0/collect-runbook-files.mjs";
import { readRunbookSchema } from "./E-0.1.2.1.0/read-runbook-schema.mjs";
import { validateRunbookIndex } from "./E-0.1.2.1.0/validate-runbook-index.mjs";
import { validateRunbookDocument } from "./E-0.1.2.1.0/validate-runbook-document.mjs";
import { validateProfileDocumentation } from "../../validation/shared/conventions/validate-profile-documentation.mjs";

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
  const indexPath = "runbooks/README.md";
  if (!files.includes(indexPath)) errors.push(`${indexPath} is required.`);
  else {
    try {
      errors.push(...validateRunbookIndex(await inventory.readText(indexPath), runbooks));
    } catch (error) {
      errors.push(`${indexPath} could not be read: ${error.message}`);
    }
  }
  if (runbooks.length) await validateRunbooks(runbooks, inventory, dependencies, errors);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}

async function validateRunbooks(runbooks, inventory, dependencies, errors) {
  let schema;
  try {
    schema = await (dependencies.readSchema ?? readRunbookSchema)();
  } catch (error) {
    errors.push(`The bundled runbook schema could not be read: ${error.message}`);
    return;
  }
  for (const path of runbooks) {
    try {
      errors.push(...validateRunbookDocument(await inventory.readText(path), path, schema));
    } catch (error) {
      errors.push(`${path} could not be read: ${error.message}`);
    }
  }
}
