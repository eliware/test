import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

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
    const document = parse(source);
    const pair = profiles.get(match[1]) ?? {};
    pair[match[2]] = { version: document?.version, requires: document?.requires };
    profiles.set(match[1], pair);
  }
  const errors = [];
  for (const [profile, pair] of profiles) {
    if (!pair.semantic || !pair.deterministic) continue;
    if (pair.semantic.version !== pair.deterministic.version)
      errors.push(`${profile} semantic and deterministic documents must use the same version.`);
    if (JSON.stringify(pair.semantic.requires) !== JSON.stringify(pair.deterministic.requires))
      errors.push(
        `${profile} semantic and deterministic documents must use the same prerequisites.`,
      );
  }
  return errors;
}
