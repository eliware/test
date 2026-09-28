import { readFile } from "node:fs/promises";
import { join } from "node:path";

const generatedPattern =
  /^\s*(?:(?:\/\/|\/\*|\*)\s*[#@]?\s*)?(?:webpackJsonp|__webpack_require__|parcelRequire|rollupStart|sourceMappingURL\s*=)/imu;

export async function findGeneratedSource(root, sourceFiles, readText) {
  const findings = [];
  for (const file of sourceFiles) {
    const source = readText
      ? await readText(file)
      : await readFile(join(root, "src", file), "utf8");
    if (generatedPattern.test(source)) findings.push(file);
  }
  return findings;
}
