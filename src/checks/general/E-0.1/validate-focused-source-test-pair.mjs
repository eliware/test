import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function validateFocusedSourceTestPair(root, { sourcePath, testPath }) {
  const source = sourcePath.replace(/^src\//u, "");
  const test = testPath.replace(/^(?:tests?|specs?)\//iu, "");
  const sourceFile = join(root, "src", source);
  const testFile = join(root, "tests", test);
  let content;
  try {
    content = await readFile(testFile, "utf8");
  } catch {
    return [`Focused test file is missing: ${test}`];
  }
  const findings = [];
  try {
    await readFile(sourceFile, "utf8");
  } catch {
    findings.push(`missing mirrored source: ${source}`);
  }
  if (source.replace(/\.mjs$/u, ".test.mjs") !== test)
    findings.push(`focused source/test paths do not mirror: ${source} and ${test}`);
  if (!/\b(?:test|it|describe)\s*\(/u.test(content))
    findings.push(`${test} is not a Jest test file`);
  if (!/(?:from|import|require\s*\()[\s\S]*src[\\/]\S+\.mjs/u.test(content))
    findings.push(`${test} does not reference an implementation module`);
  return findings;
}
