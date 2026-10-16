import { join } from "node:path";
import { parseBoundedYamlDocuments } from "../../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";

export async function loadRepoMapSchema(repoMapPath, read) {
  const schemaPath = join(repoMapPath, "..", "repo-map-schema.yaml");
  let source;
  try {
    source = await read(schemaPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return { available: false, schema: null, error: null };
    return {
      available: true,
      schema: null,
      error: `repo-map-schema.yaml could not be read: ${error.message}`,
    };
  }
  try {
    const documents = parseBoundedYamlDocuments(source, schemaPath, { lineCharacters: Infinity });
    const errors = documents.flatMap((document) => document.errors);
    if (errors.length || documents.length !== 1)
      throw errors[0] ?? new Error("the schema must contain one YAML document");
    return { available: true, schema: documents[0].toJSON(), error: null };
  } catch (error) {
    return {
      available: true,
      schema: null,
      error: `repo-map-schema.yaml is invalid YAML: ${error.message}`,
    };
  }
}
