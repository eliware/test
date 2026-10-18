import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseBoundedYamlDocuments } from "../../../../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";
import { listSpecificationEntries } from "../../../list-specification-entries.mjs";

export async function readConsumerSpecificationFiles(root, options) {
  const { read = readFile, readdir } = options;
  let entries;
  try {
    entries = await listSpecificationEntries(root, { list: readdir });
  } catch (error) {
    return { error: `Consumer specification discovery failed: ${error.message}` };
  }
  const paths = entries.filter(({ path, type }) => type === "file" && /\.ya?ml$/iu.test(path));
  const directivePathExists = paths.some(({ path }) => path === "specs/directives.yaml");
  const result = {
    errors: [],
    documents: [],
    directivePathExists,
    directivePathParsed: false,
    directivePathHasDirectives: false,
  };
  for (const { path } of paths) {
    let source;
    try {
      source = await read(join(root, path), "utf8");
    } catch (error) {
      result.errors.push(`${path} could not be read: ${error.message}`);
      continue;
    }
    let parsed;
    try {
      parsed = parseBoundedYamlDocuments(source, path);
    } catch (error) {
      result.errors.push(`${path} is invalid YAML: ${error.message}`);
      continue;
    }
    const parseErrors = parsed.flatMap((document) => document.errors);
    if (parseErrors.length) {
      result.errors.push(
        `${path} is invalid YAML: ${parseErrors.map(({ message }) => message).join("; ")}`,
      );
      continue;
    }
    const values = parsed.map((document) => document.toJSON());
    if (path === "specs/directives.yaml") {
      result.directivePathParsed = true;
      result.directivePathHasDirectives = values.some(hasDirectives);
    }
    values.forEach((value, index) => {
      if (hasDirectives(value))
        result.documents.push({ path: `${path} document ${index + 1}`, value });
    });
  }
  return result;
}

function hasDirectives(value) {
  return Boolean(
    value && typeof value === "object" && !Array.isArray(value) && "directives" in value,
  );
}
