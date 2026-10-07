import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const profileDocument = /^(?<profile>[a-z0-9-]+)-(?:semantic|deterministic)\.yaml$/u;

export function readProfileDocuments(directory) {
  const path = directory instanceof URL ? fileURLToPath(directory) : directory;
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isFile() && profileDocument.test(entry.name))
    .map((entry) => ({
      source: entry.name,
      document: parse(readFileSync(join(path, entry.name), "utf8")),
    }))
    .sort((left, right) => left.source.localeCompare(right.source));
}
