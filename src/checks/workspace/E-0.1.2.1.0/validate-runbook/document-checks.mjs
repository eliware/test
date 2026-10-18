import { readRunbookSchema } from "../read-runbook-schema.mjs";
import { validateRunbookDocument } from "./document.mjs";

export async function validateRunbookDocuments(runbooks, inventory, dependencies = {}) {
  let schema;
  try {
    schema = await (dependencies.readSchema ?? readRunbookSchema)();
  } catch (error) {
    return [`The bundled runbook schema could not be read: ${error.message}`];
  }
  const errors = [];
  for (const path of runbooks) {
    try {
      errors.push(...validateRunbookDocument(await inventory.readText(path), path, schema));
    } catch (error) {
      errors.push(`${path} could not be read: ${error.message}`);
    }
  }
  return errors;
}
