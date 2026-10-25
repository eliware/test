import { parseBoundedYamlDocuments } from "../../../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";

export function parseBundledYamlDocuments(source, path) {
  const parsed = parseBoundedYamlDocuments(source, path);
  const errors = parsed.flatMap((document) => document.errors);
  if (errors.length) throw new Error(errors.map(({ message }) => message).join(". "));
  return parsed.map((document) => document.toJSON());
}
