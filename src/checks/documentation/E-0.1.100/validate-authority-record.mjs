import { validateAuthorityRecordReferences } from "./validate-authority-record-references.mjs";
import { validateAuthorityRecordShape } from "./validate-authority-record-shape.mjs";

export async function validateAuthorityRecord({ root, file, document }) {
  const shapeError = validateAuthorityRecordShape(document);
  if (shapeError) return shapeError;
  return validateAuthorityRecordReferences({ root, file, document });
}
