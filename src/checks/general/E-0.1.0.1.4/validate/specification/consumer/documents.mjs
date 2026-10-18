import { validateSpecificationDocument } from "../document.mjs";
import { validateSpecificationIds } from "../ids.mjs";

export function validateConsumerSpecificationDocuments(
  documents,
  namespace,
  { directivePathExists, directivePathParsed, directivePathHasDirectives },
) {
  const errors = [];
  if (!directivePathExists) errors.push("specs/directives.yaml is required.");
  else if (directivePathParsed && !directivePathHasDirectives)
    errors.push("specs/directives.yaml must contain a directive document.");
  const ids = new Map();
  for (const { path, value } of documents) {
    errors.push(...validateSpecificationDocument(value, path, { ordering: false }));
    const sourcePath = path.replace(/ document \d+$/u, "");
    const directives = ids.get(sourcePath) ?? [];
    if (Array.isArray(value.directives)) directives.push(...value.directives);
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
