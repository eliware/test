import { readFile } from "node:fs/promises";
import { fail, pass } from "../../check-result.mjs";
import { join } from "node:path";
import { collectRepositoryFiles } from "./collect-repository-files.mjs";
import { collectRepositoryDirectories } from "./collect-repository-directories.mjs";
import { findMirrorViolations, findDuplicatePathViolations, findOrphanTestViolations, findTestContractViolations } from "./validate-mirror-structure.mjs";
import { findMisplacedArtifacts } from "./validate-test-artifacts.mjs";
import { findGeneratedSource } from "./validate-generated-source.mjs";

export const ruleId = "E-1.17";
export const parentRuleId = "E-1";
export const collect = collectRepositoryFiles;

export async function run({ root, focusedScope = null }) {
  if (focusedScope) return runFocused(root, focusedScope);
  let sourceFiles;
  let testFiles;
  let sourceDirectories;
  let testDirectories;
  try {
    sourceFiles = await collectRepositoryFiles(join(root, "src"), join(root, "src"));
    testFiles = await collectRepositoryFiles(join(root, "tests"), join(root, "tests"));
    sourceDirectories = await collectRepositoryDirectories(join(root, "src"), join(root, "src"));
    testDirectories = await collectRepositoryDirectories(join(root, "tests"), join(root, "tests"));
  } catch {
    return fail(ruleId, "src/ is required for source/test mirroring.");
  }
  const findings = findMirrorViolations(sourceFiles, testFiles, sourceDirectories, testDirectories);
  const sourceModules = sourceFiles.filter((file) => file.endsWith(".mjs"));
  const expectedTests = new Set(sourceModules.map((source) => source.replace(/\.mjs$/u, ".test.mjs")));
  findings.push(...findDuplicatePathViolations(sourceFiles, testFiles));
  findings.push(...findOrphanTestViolations(testFiles, expectedTests).map((file) => `orphan test is not an approved cross-cutting suite: ${file}`));
  const testContents = new Map();
  for (const file of testFiles.filter((candidate) => candidate.endsWith(".test.mjs"))) {
    testContents.set(file, await readFile(join(root, "tests", file), "utf8"));
  }
  findings.push(...findTestContractViolations(sourceModules, testContents));
  const misplacedArtifacts = findMisplacedArtifacts(sourceFiles, testFiles);
  if (misplacedArtifacts.length > 0)
    findings.push(`test artifacts must be under artifacts/: ${misplacedArtifacts.join(", ")}`);
  const bundled = await findGeneratedSource(root, sourceModules);
  if (bundled.length > 0) findings.push(`generated or bundled source is not allowed: ${bundled.join(", ")}`);
  if (findings.length > 0) {
    return fail(ruleId, `Source/test structure is not exactly mirrored; ${findings.join("; ")}.`);
  }
  return pass(ruleId);
}

async function runFocused(root, { sourcePath, testPath }) {
  const source = sourcePath.replace(/^src\//u, "");
  const test = testPath.replace(/^(?:tests?|specs?)\//iu, "");
  const sourceFile = join(root, "src", source);
  const testFile = join(root, "tests", test);
  try {
    const content = await readFile(testFile, "utf8");
    const findings = [];
    try { await readFile(sourceFile, "utf8"); } catch { findings.push(`missing mirrored source: ${source}`); }
    if (source.replace(/\.mjs$/u, ".test.mjs") !== test)
      findings.push(`focused source/test paths do not mirror: ${source} and ${test}`);
    if (!/\b(?:test|it|describe)\s*\(/u.test(content)) findings.push(`${test} is not a Jest test file`);
    if (!/(?:from|import|require\s*\()[\s\S]*src[\\/]\S+\.mjs/u.test(content))
      findings.push(`${test} does not reference an implementation module`);
    return findings.length ? fail(ruleId, `Source/test structure is not mirrored; ${findings.join("; ")}.`) : pass(ruleId);
  } catch {
    return fail(ruleId, `Focused test file is missing: ${test}`);
  }
}
