import { validateDocumentationIndexes } from "./documentation-indexes.mjs";
import { validateExamplesIndex } from "./examples-index.mjs";

export async function validateApplicationDocumentation(context = {}) {
  const errors = await validateDocumentationIndexes(context);
  errors.push(...(await validateExamplesIndex(context)));
  return errors;
}
