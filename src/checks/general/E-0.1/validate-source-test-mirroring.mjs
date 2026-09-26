import { readFile } from "node:fs/promises";
import { fail, pass } from "../../check-result.mjs";
import { join } from "node:path";
import { collectRepositoryFiles } from "./collect-repository-files.mjs";
import { collectRepositoryDirectories } from "./collect-repository-directories.mjs";
import { findMirrorViolations } from "./find-source-test-mirror-violations.mjs";
import { findDuplicatePathViolations } from "./find-duplicate-test-path-violations.mjs";
import { findOrphanTestViolations } from "./find-orphan-test-violations.mjs";
import { findTestContractViolations } from "./find-test-contract-violations.mjs";
import { findMisplacedArtifacts } from "./validate-test-artifacts.mjs";
import { findGeneratedSource } from "./validate-generated-source.mjs";
import { validateFocusedSourceTestPair } from "./validate-focused-source-test-pair.mjs";

export async function runSourceTestMirroring({ root, ruleId, focusedScope = null, repositoryInventory }) {
  if (focusedScope) return runFocused(root, focusedScope, ruleId, repositoryInventory);
  let sourceFiles;
  let testFiles;
  let sourceDirectories;
  let testDirectories;
  try {
    if (repositoryInventory) {
      const [sourceRecords, testRecords] = await Promise.all([
        repositoryInventory.entriesUnder(join(root, "src")),
        repositoryInventory.entriesUnder(join(root, "tests")),
      ]);
      sourceFiles = sourceRecords
        .filter(({ path, type }) => type === "file" && path.startsWith("src/"))
        .map(({ path }) => path.slice("src/".length));
      testFiles = testRecords
        .filter(({ path, type }) => type === "file" && path.startsWith("tests/"))
        .map(({ path }) => path.slice("tests/".length));
      sourceDirectories = sourceRecords
        .filter(({ path, type }) => type === "directory" && path.startsWith("src/"))
        .map(({ path }) => path.slice("src/".length));
      testDirectories = testRecords
        .filter(({ path, type }) => type === "directory" && path.startsWith("tests/"))
        .map(({ path }) => path.slice("tests/".length));
    } else {
      sourceFiles = await collectRepositoryFiles(join(root, "src"), join(root, "src"));
      testFiles = await collectRepositoryFiles(join(root, "tests"), join(root, "tests"));
      sourceDirectories = await collectRepositoryDirectories(join(root, "src"), join(root, "src"));
      testDirectories = await collectRepositoryDirectories(join(root, "tests"), join(root, "tests"));
    }
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
    testContents.set(file, repositoryInventory
      ? await repositoryInventory.readText(join(root, "tests", file))
      : await readFile(join(root, "tests", file), "utf8"));
  }
  findings.push(...findTestContractViolations(sourceModules, testContents));
  const misplacedArtifacts = findMisplacedArtifacts(sourceFiles, testFiles);
  if (misplacedArtifacts.length > 0)
    findings.push(`test artifacts must be under artifacts/: ${misplacedArtifacts.join(", ")}`);
  const bundled = await findGeneratedSource(root, sourceModules, repositoryInventory
    ? (file) => repositoryInventory.readText(join(root, "src", file))
    : undefined);
  if (bundled.length > 0) findings.push(`generated or bundled source is not allowed: ${bundled.join(", ")}`);
  if (findings.length > 0) {
    return fail(ruleId, `Source/test structure is not exactly mirrored; ${findings.join("; ")}.`);
  }
  return pass(ruleId);
}

async function runFocused(root, { sourcePath, testPath }, ruleId, repositoryInventory) {
  const findings = await validateFocusedSourceTestPair(root, { sourcePath, testPath }, repositoryInventory
    ? (file) => repositoryInventory.readText(file)
    : undefined);
  return findings.length ? fail(ruleId, `Source/test structure is not mirrored; ${findings.join("; ")}.`) : pass(ruleId);
}
