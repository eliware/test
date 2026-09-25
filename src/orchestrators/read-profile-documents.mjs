import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const nonProfileDocuments = new Set(["authority.json", "authority-map.json", "directives.json"]);

export function readProfileDocuments(directory) {
  const path = directory instanceof URL ? fileURLToPath(directory) : directory;
  return readdirSync(path, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".json") &&
        !nonProfileDocuments.has(entry.name),
    )
    .map((entry) => ({
      source: entry.name,
      document: JSON.parse(readFileSync(join(path, entry.name), "utf8")),
    }))
    .sort((left, right) => left.source.localeCompare(right.source));
}
