import { validateSpecificationDocument } from "../specification/document.mjs";
import { validateSpecificationIds } from "../specification/ids.mjs";

export function validateBundledConventionDocuments(documents, namespace) {
  const errors = [];
  const ids = new Map();
  for (const { path, value } of documents) {
    errors.push(...validateSpecificationDocument(value, path));
    const sourcePath = path.replace(/ document \d+$/u, "");
    const directives = ids.get(sourcePath) ?? [];
    if (Array.isArray(value?.directives)) directives.push(...value.directives);
    ids.set(sourcePath, directives);
  }
  errors.push(
    ...validateSpecificationIds(
      [...ids].map(([path, directives]) => ({ path, directives })),
      namespace,
    ),
  );
  return errors;
}
