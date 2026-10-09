import { fail, pass } from "../check-result.mjs";
import { findMachineSpecificPaths } from "./E-0.1.0.1.9/find-machine-specific-paths.mjs";

export const ruleId = "E-0.1.0.1.9";

export async function run(context = {}) {
  const inventory = context.repositoryInventory;
  if (!inventory?.repositoryFiles || !inventory?.readBytes)
    return fail(ruleId, "Repository files could not be inspected.");
  try {
    const files = await inventory.repositoryFiles();
    const findings = await findMachineSpecificPaths(files, inventory.readBytes);
    return findings.length
      ? fail(ruleId, `Machine-specific absolute paths found: ${findings.join(", ")}.`)
      : pass(ruleId);
  } catch (error) {
    return fail(ruleId, `Repository files could not be inspected: ${error.message}`);
  }
}
