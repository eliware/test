import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseBoundedYamlDocuments } from "../../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";
import { loadRepoMapSchema } from "./schema.mjs";
import { validateRepoMapAgainstSchema } from "../validate-repo-map-schema.mjs";
import { findRepositoryRecord } from "./find-repository-record.mjs";

export async function loadRepoMapRecord(root, packageJson, { read = readFile } = {}) {
  const repoMapPath = join(root, "..", "docs", "repo-map.yaml");
  let source;
  try {
    source = await read(repoMapPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return { available: false, record: null, error: null };
    return {
      available: true,
      record: null,
      error: `repo-map.yaml could not be read: ${error.message}`,
    };
  }
  let documents;
  try {
    documents = parseBoundedYamlDocuments(source, repoMapPath, { lineCharacters: Infinity });
    const parseError = documents.flatMap((document) => document.errors)[0];
    if (parseError) throw parseError;
  } catch (error) {
    return {
      available: true,
      record: null,
      error: `repo-map.yaml is invalid YAML: ${error.message}`,
    };
  }
  const values = documents.map((document) => document.toJSON());
  const schema = await loadRepoMapSchema(repoMapPath, read);
  if (schema.error) return { available: true, record: null, error: schema.error };
  if (schema.available) {
    const schemaError = values
      .map((value) => validateRepoMapAgainstSchema(value, schema.schema))
      .find(Boolean);
    if (schemaError) return { available: true, record: null, error: schemaError };
  }
  if (!values.length || values.some((document) => !Array.isArray(document?.repositories)))
    return {
      available: true,
      record: null,
      error: "repo-map.yaml must contain a repositories array.",
    };
  return { available: true, ...findRepositoryRecord(values, packageJson) };
}
