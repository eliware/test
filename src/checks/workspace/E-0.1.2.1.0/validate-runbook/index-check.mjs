import { validateRunbookIndex } from "./index.mjs";

export async function validateRunbookIndexCheck(files, inventory, runbooks) {
  const indexPath = "runbooks/README.md";
  if (!files.includes(indexPath)) return [`${indexPath} is required.`];
  try {
    return validateRunbookIndex(await inventory.readText(indexPath), runbooks);
  } catch (error) {
    return [`${indexPath} could not be read: ${error.message}`];
  }
}
