import { runPureExportBarrelPolicy } from "../../general/E-1/E-1.20/validate-pure-export-barrels.mjs";

export const ruleId = "E-1.40.14";
export const parentRuleId = "E-1.40";

export function run(options) {
  return runPureExportBarrelPolicy({ ...options, ruleId });
}
