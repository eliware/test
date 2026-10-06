import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseAllDocuments } from "yaml";

export async function loadRepoMapRecord(root, packageJson, { read = readFile } = {}) {
  let source;
  try {
    source = await read(join(root, "..", "docs", "repo-map.yaml"), "utf8");
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
    documents = parseAllDocuments(source);
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
  if (!values.length || values.some((document) => !Array.isArray(document?.repositories)))
    return {
      available: true,
      record: null,
      error: "repo-map.yaml must contain a repositories array.",
    };
  const match = /^@eliware\/([^/]+)$/u.exec(packageJson?.name ?? "");
  if (!match)
    return {
      available: true,
      record: null,
      error: "package.json.name cannot identify a repo-map entry.",
    };
  const repository = `eliware/${match[1]}`;
  const records = values.flatMap((document) =>
    document.repositories.filter((candidate) => candidate?.repository === repository),
  );
  if (records.length > 1)
    return {
      available: true,
      record: null,
      error: `repo-map.yaml has duplicate entries for ${repository}.`,
    };
  return records[0]
    ? { available: true, record: records[0], error: null }
    : { available: true, record: null, error: `repo-map.yaml has no entry for ${repository}.` };
}
