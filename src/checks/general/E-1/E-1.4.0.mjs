import { fail, pass } from "../../check-result.mjs";
import { validateMaintainedFileSyntax } from "./validate-maintained-file-syntax.mjs";

export const ruleId = "E-1.4.0";
export const parentRuleId = "E-1.4";
export const focusedSafe = true;

export async function run({
  root,
  repositoryFiles,
  executeLint = false,
  mode = null,
  focusedScope = null,
  validateFiles = validateMaintainedFileSyntax,
}) {
  if (!executeLint || (mode !== null && mode !== "lint")) return pass(ruleId);
  const files = focusedScope?.paths ?? repositoryFiles;
  if (!Array.isArray(files))
    return fail(ruleId, "Repository file inventory is unavailable for syntax validation.");
  const failures = await validateFiles(root, files);
  return failures.length
    ? fail(ruleId, `Maintained files must parse successfully:\n${failures.join("\n")}`)
    : pass(ruleId);
}
