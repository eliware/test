import { fail, pass } from "../../check-result.mjs";
import { findDirectToolUses } from "./E-0.1.3/find-direct-tool-uses.mjs";
import { findDirectValidationDependencies } from "./E-0.1.3/validate-validation-dependencies.mjs";
import { findInvalidValidationScripts } from "./E-0.1.3/validate-validation-scripts.mjs";
import { findRepositoryFiles } from "./find-repository-files.mjs";

export const ruleId = "E-0.1.3";
export const parentRuleId = "E-0.1";

export async function run({ packageJson, root, files, repositoryInventory }) {
  const failures = [];
  const ownsHarness = packageJson?.name === "@eliware/test";
  const invalidScripts = findInvalidValidationScripts(packageJson?.scripts);
  if (invalidScripts.length > 0)
    failures.push(
      `Validation scripts must use eliware-test rather than direct tools: ${invalidScripts.join(", ")}.`,
    );
  const directTools = ownsHarness ? [] : findDirectValidationDependencies(packageJson);
  if (directTools.length > 0)
    failures.push(
      `Repositories must not directly declare shared validation tools: ${directTools.join(", ")}.`,
    );
  if (root && !ownsHarness) {
    try {
      const repositoryFiles =
        files ??
        (repositoryInventory
          ? await repositoryInventory.repositoryFiles()
          : await findRepositoryFiles(root));
      const directUses = repositoryInventory
        ? await findDirectToolUses(root, repositoryFiles, (file) =>
            repositoryInventory.readText(file),
          )
        : await findDirectToolUses(root, repositoryFiles);
      if (directUses.length > 0)
        failures.push(
          `Direct validation-tool use found in repository files: ${directUses.join(", ")}.`,
        );
    } catch (error) {
      failures.push(`Repository validation surfaces could not be inspected: ${error.message}`);
    }
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
