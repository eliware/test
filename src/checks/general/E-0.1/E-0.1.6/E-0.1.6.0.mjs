import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { isForbiddenPath } from "./sensitive-path-classifier.mjs";
import { isAllowedSensitiveFile } from "./inspect-sensitive-file.mjs";
import { findRepositoryFiles } from "../find-repository-files.mjs";
import { readSensitiveExemptions } from "./read-sensitive-exemptions.mjs";

export const ruleId = "E-0.1.6.0";
export const parentRuleId = "E-0.1.6";

export async function run(
  { root, packageJson, repositoryInventory, files: suppliedFiles },
  findFiles = findRepositoryFiles,
  readSensitiveText = readSensitivePath,
) {
  const findings = [];
  const allowed = readSensitiveExemptions(packageJson, ruleId);
  try {
    const files =
      suppliedFiles ??
      (repositoryInventory ? await repositoryInventory.repositoryFiles() : await findFiles(root));
    for (const path of files) {
      if (!isForbiddenPath(path) || allowed.has(path)) continue;
      const content = await readSensitiveText(root, path, repositoryInventory);
      if (!isAllowedSensitiveFile(path, content)) findings.push(path);
    }
  } catch {
    return fail(
      ruleId,
      "Repository contents could not be inspected for secret or runtime-state artifacts.",
    );
  }
  if (findings.length > 0)
    return fail(
      ruleId,
      `Unauthorized secret or runtime-state paths found: ${findings.join(", ")}.`,
    );
  return pass(ruleId);
}

function readSensitivePath(root, path, repositoryInventory) {
  const filePath = join(root, path);
  return repositoryInventory ? repositoryInventory.readText(filePath) : readFile(filePath, "utf8");
}
