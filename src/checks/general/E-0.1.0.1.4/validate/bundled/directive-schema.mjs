import { validateDirectiveSchema } from "../directive-schema.mjs";

export function validateBundledDirectiveSchema(documents) {
  return documents.flatMap((document) => validateDirectiveSchema(document));
}
