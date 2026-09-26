import { runPureExportBarrelPolicy } from "../../general/E-0.1/E-0.1.20/validate-pure-export-barrels.mjs";

export const ruleId = "E-0.1.130.12";
export const parentRuleId = "E-0.1.130";
export const repositoryInventoryOptions = { includeTestResultsUnder: ["src"] };

export function run(options) {
  return runPureExportBarrelPolicy({ ...options, ruleId });
}
