import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findRepositoryFiles } from "../shared/repository/find-repository-files.mjs";
import { findTestPolicyViolations } from "./scan-test-policy.mjs";

const testFilePattern = /^tests\/.*\.(?:test|spec)\.(?:c|m)?(?:j|t)sx?$/iu;

export async function validateTestIsolationPolicy(root) {
  const files = await findRepositoryFiles(root);
  const testFiles = files.filter((path) => testFilePattern.test(path));
  const violations = [];
  for (const path of testFiles) {
    const source = await readFile(join(root, path), "utf8");
    violations.push(...findTestPolicyViolations(source, path));
  }
  return violations;
}
