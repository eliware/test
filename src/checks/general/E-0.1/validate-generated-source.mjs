import { readFile } from "node:fs/promises";
import { join } from "node:path";

const generatedPattern = /^(?:\s*(?:\/\/|\/\*|\*\/?))?\s*(?:webpackJsonp|__webpack_require__|parcelRequire|rollupStart|sourceMappingURL=)/mu;

export async function findGeneratedSource(root, sourceFiles) {
  const findings = [];
  for (const file of sourceFiles) {
    if (generatedPattern.test(await readFile(join(root, "src", file), "utf8"))) findings.push(file);
  }
  return findings;
}
