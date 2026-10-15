import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseBoundedYamlDocuments } from "../../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";
import { listSpecificationEntries } from "../list-specification-entries.mjs";
import { validateSpecificationDocument } from "./specification/document.mjs";
import { validateSpecificationIds } from "./specification/ids.mjs";

export async function validateConsumerSpecifications(
  root,
  namespace,
  { read = readFile, readdir } = {},
) {
  const errors = [];
  if (typeof namespace !== "string" || !/^E-\d+$/u.test(namespace))
    errors.push("package.json.eliware.id must define the assigned E-number.");
  let entries;
  try {
    entries = await listSpecificationEntries(root, { list: readdir });
  } catch (error) {
    return [`Consumer specification discovery failed: ${error.message}`];
  }
  const paths = entries.filter(({ path, type }) => type === "file" && /\.ya?ml$/iu.test(path));
  const directivePathExists = paths.some(({ path }) => path === "specs/directives.yaml");
  if (!directivePathExists) errors.push("specs/directives.yaml is required.");
  const documents = [];
  for (const { path } of paths) {
    let source;
    try {
      source = await read(join(root, path), "utf8");
    } catch (error) {
      errors.push(`${path} could not be read: ${error.message}`);
      continue;
    }
    let parsed;
    try {
      parsed = parseBoundedYamlDocuments(source, path);
    } catch (error) {
      errors.push(`${path} is invalid YAML: ${error.message}`);
      continue;
    }
    const parseErrors = parsed.flatMap((document) => document.errors);
    if (parseErrors.length) {
      errors.push(
        `${path} is invalid YAML: ${parseErrors.map(({ message }) => message).join("; ")}`,
      );
      continue;
    }
    const values = parsed.map((document) => document.toJSON());
    if (path === "specs/directives.yaml" && !values.some(hasDirectives))
      errors.push("specs/directives.yaml must contain a directive document.");
    values.forEach((value, index) => {
      if (hasDirectives(value)) documents.push({ path: `${path} document ${index + 1}`, value });
    });
  }
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

function hasDirectives(value) {
  return Boolean(
    value && typeof value === "object" && !Array.isArray(value) && "directives" in value,
  );
}
