import { fail, pass } from "../../check-result.mjs";
import { join } from "node:path";
import { readSourceTestMirrorInventory } from "./read-source-test-mirror-inventory.mjs";
import { readSourceTestContents } from "./read-source-test-test-contents.mjs";
import { findMirrorViolations } from "./find-source-test-mirror-violations.mjs";
import { findDuplicatePathViolations } from "./find-duplicate-test-path-violations.mjs";
import { findOrphanTestViolations } from "./find-orphan-test-violations.mjs";
import { findTestContractViolations } from "./find-test-contract-violations.mjs";
import { findMisplacedArtifacts } from "./validate-test-artifacts.mjs";
import { findGeneratedSource } from "./validate-generated-source.mjs";
import { validateFocusedSourceTestPair } from "./validate-focused-source-test-pair.mjs";

export async function runSourceTestMirroring({ root, ruleId, focusedScope = null, repositoryInventory }) {
  if (focusedScope) return runFocused(root, focusedScope, ruleId, repositoryInventory);
  let mirrorInventory;
  try {
    mirrorInventory = await readSourceTestMirrorInventory(root, repositoryInventory);
  } catch {
    return fail(ruleId, "src/ is required for source/test mirroring.");
  }
  const { sourceFiles, testFiles, sourceDirectories, testDirectories } = mirrorInventory;
  const findings = findMirrorViolations(sourceFiles, testFiles, sourceDirectories, testDirectories);
  const sourceModules = sourceFiles.filter((file) => file.endsWith(".mjs"));
  const expectedTests = new Set(sourceModules.map((source) => source.replace(/\.mjs$/u, ".test.mjs")));
  findings.push(...findDuplicatePathViolations(sourceFiles, testFiles));
  findings.push(...findOrphanTestViolations(testFiles, expectedTests).map((file) => `orphan test is not an approved cross-cutting suite: ${file}`));
  const testContents = await readSourceTestContents(root, testFiles, repositoryInventory);
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
