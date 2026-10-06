import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

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
  let document;
  try {
    document = parse(source);
  } catch (error) {
    return {
      available: true,
      record: null,
      error: `repo-map.yaml is invalid YAML: ${error.message}`,
    };
  }
  if (!Array.isArray(document?.repositories))
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
  const record = document.repositories.find((candidate) => candidate?.repository === repository);
  return record
    ? { available: true, record, error: null }
    : { available: true, record: null, error: `repo-map.yaml has no entry for ${repository}.` };
}
