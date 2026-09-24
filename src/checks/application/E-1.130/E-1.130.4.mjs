import { runSourceTestMirroring } from "../../general/E-1/validate-source-test-mirroring.mjs";
import { collectRepositoryFiles } from "../../general/E-1/collect-repository-files.mjs";

export const ruleId = "E-1.130.4";
export const parentRuleId = "E-1.130";
export const focusedSafe = true;
export const collect = collectRepositoryFiles;

export function run({ root, focusedScope = null }) {
  return runSourceTestMirroring({ root, ruleId, focusedScope });
}
