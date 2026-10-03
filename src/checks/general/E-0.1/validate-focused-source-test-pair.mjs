import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, sep } from "node:path";
import { validateTestContract } from "./find-test-contract-violations.mjs";

export async function validateFocusedSourceTestPair(
  root,
  { sourcePath, testPath },
  readText = readFile,
) {
  const source = sourcePath?.replaceAll("\\", "/");
  const test = testPath?.replaceAll("\\", "/");
  if (
    typeof source !== "string" ||
    typeof test !== "string" ||
    !/^src\/.+\.mjs$/u.test(source) ||
    source.split("/").includes("..") ||
    !/^(?:tests|test)\/.+\.test\.mjs$/u.test(test) ||
    test.split("/").includes("..")
  ) {
    return ["Focused source/test paths must be repository-relative mirrored module paths."];
  }
  const sourceRelative = source.slice("src/".length);
  const testDirectory = test.startsWith("test/") ? "test" : "tests";
  const testRelative = test.slice(testDirectory.length + 1);
  if (sourceRelative.replace(/\.mjs$/u, ".test.mjs") !== testRelative)
    return [`focused source/test paths do not mirror: ${sourceRelative} and ${testRelative}`];
  const sourceFile = join(root, source);
  const testFile = join(root, test);
  let rootRealPath;
  let sourceRealPath;
  let testRealPath;
  try {
    rootRealPath = await realpath(root);
  } catch {
    return [`Focused test file is missing: ${testRelative}`];
  }
  try {
    testRealPath = await realpath(testFile);
  } catch {
    return [`Focused test file is missing: ${testRelative}`];
  }
  try {
    sourceRealPath = await realpath(sourceFile);
  } catch {
    sourceRealPath = null;
  }
  const outside = (path) => {
    const pathRelative = relative(rootRealPath, path);
    return pathRelative === ".." || pathRelative.startsWith(`..${sep}`) || isAbsolute(pathRelative);
  };
  if ((sourceRealPath && outside(sourceRealPath)) || outside(testRealPath))
    return ["Focused source/test paths must resolve inside the repository."];
  let content;
  try {
    content = await readText(testRealPath, "utf8");
  } catch {
    return [`Focused test file is missing: ${testRelative}`];
  }
  const findings = validateTestContract(sourceRelative, test, content);
  if (!sourceRealPath) {
    // codescope ignore: This adds a finding that runFocused converts to a failing check result.
    findings.push(`missing mirrored source: ${sourceRelative}`);
  }
  return findings;
}
