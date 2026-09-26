import { runSourceTestMirroring } from "../../general/E-0.1/validate-source-test-mirroring.mjs";
import { collectRepositoryFiles } from "../../general/E-0.1/collect-repository-files.mjs";

export const ruleId = "E-0.1.130.4";
export const parentRuleId = "E-0.1.130";
export const focusedSafe = true;
export const repositoryInventoryOptions = {
  expandedDirectories: ["src", "tests"],
  includeTestResultsUnder: ["src", "tests"],
};
export const collect = collectRepositoryFiles;

export function run({ root, focusedScope = null, repositoryInventory }) {
  return runSourceTestMirroring({ root, ruleId, focusedScope, repositoryInventory });
}
