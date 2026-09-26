import { readdir } from "node:fs/promises";
import { join } from "node:path";

const ignoredDirectories = new Set([".git", "node_modules", "coverage", "dist", "build"]);

export async function findJestConfigFiles(directory) {
  const findings = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name))
        findings.push(...(await findJestConfigFiles(join(directory, entry.name))));
    } else if (/^jest\.config(?:\.[^.]+)?$/i.test(entry.name)) {
      findings.push(join(directory, entry.name));
    }
  }
  return findings;
}
