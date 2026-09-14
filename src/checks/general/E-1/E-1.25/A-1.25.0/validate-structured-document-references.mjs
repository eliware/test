import { collectRegisteredExternalReferences } from "./collect-registered-external-references.mjs";
import { collectStructuredReferences } from "./collect-structured-references.mjs";
import { referenceRegistrationKey } from "./reference-registration-key.mjs";
import { validateStructuredReference } from "./resolve-structured-reference.mjs";

export async function validateStructuredDocumentReferences({ root, documents }) {
  const registered = new Set(
    [...documents.values()]
      .flatMap((document) => [...collectRegisteredExternalReferences(document)])
      .map(referenceRegistrationKey),
  );
  for (const [file, document] of documents) {
    for (const reference of collectStructuredReferences(document, file)) {
      if (reference.error) return `${reference.error} in ${file}.`;
      const error = await validateStructuredReference({
        root,
        file,
        field: reference.field,
        value: reference.value,
        registered:
          reference.external && registered.has(referenceRegistrationKey(reference.value)),
      });
      if (error) return `Structured reference ${reference.value} in ${file} ${error}.`;
    }
  }
  return null;
}
