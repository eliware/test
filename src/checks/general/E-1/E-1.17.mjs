import { fail, pass } from "../../check-result.mjs";
import { join } from "node:path";
import { collectRepositoryFiles } from "./collect-repository-files.mjs";
import { collectRepositoryDirectories } from "./collect-repository-directories.mjs";
import { findMirrorViolations } from "./validate-mirror-structure.mjs";
import { findMisplacedArtifacts } from "./validate-test-artifacts.mjs";
import { findGeneratedSource } from "./validate-generated-source.mjs";

export const ruleId = "E-1.17";
export const parentRuleId = "E-1";
export const collect = collectRepositoryFiles;

export async function run({ root }) {
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
