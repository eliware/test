import { validateAuthorityRecordReferences } from "./validate-authority-record-references.mjs";
import { validateAuthorityRecordShape } from "./validate-authority-record-shape.mjs";

export async function validateAuthorityRecord({ root, file, document, registeredRepositoryRoots }) {
  const shapeError = validateAuthorityRecordShape(document);
  const referenceError = await validateAuthorityRecordReferences({
    root,
    file,
    document,
    registeredRepositoryRoots,
  });
  const failures = [shapeError, referenceError].filter(Boolean);
  return failures.length ? failures.join("\n") : null;
}
