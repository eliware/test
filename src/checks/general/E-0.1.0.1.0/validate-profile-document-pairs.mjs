import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseAllDocuments } from "yaml";

export async function validateProfileDocumentPairs(root) {
  const directory = join(root, "specs", "conventions");
  try {
    await access(directory);
  } catch {
    return [];
  }
  const names = await readdir(directory);
  const profiles = new Map();
  for (const name of names) {
    const match = /^([a-z0-9-]+)-(semantic|deterministic)\.yaml$/u.exec(name);
    if (!match) continue;
    const source = await readFile(join(directory, name), "utf8");
    const documents = parseAllDocuments(source);
    const parseError = documents.flatMap((document) => document.errors)[0];
    if (parseError) throw parseError;
    const pair = profiles.get(match[1]) ?? {};
    pair[match[2]] = documents.map((document) => {
      const value = document.toJSON();
      return { version: value?.version, requires: value?.requires };
    });
    profiles.set(match[1], pair);
  }
  const errors = [];
  for (const [profile, pair] of profiles) {
    if (!pair.semantic || !pair.deterministic) continue;
    if (pair.semantic.length !== pair.deterministic.length)
      errors.push(
        `${profile} semantic and deterministic documents must use the same stream length.`,
      );
    if (
      pair.semantic.some(
        (document, index) => document.version !== pair.deterministic[index]?.version,
      )
    )
      errors.push(`${profile} semantic and deterministic documents must use the same version.`);
    if (
      pair.semantic.some(
        (document, index) =>
          JSON.stringify(document.requires) !== JSON.stringify(pair.deterministic[index]?.requires),
      )
    )
      errors.push(
        `${profile} semantic and deterministic documents must use the same prerequisites.`,
      );
  }
  return errors;
}
