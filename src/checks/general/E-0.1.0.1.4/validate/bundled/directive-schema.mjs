import validateDirectiveSchema from "../directive-schema.mjs";
export default function validateBundledDirectiveSchema(documents) {
  return documents.flatMap((document) => validateDirectiveSchema(document));
}
