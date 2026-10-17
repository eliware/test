import { posix } from "node:path";
import { findSeparateTestRunnerConfigs } from "../../find-separate-test-runner-configs.mjs";
import { validateProductionCoveragePolicy } from "../production-coverage-policy.mjs";
import { validateTestToolReferences } from "../test-tool-references.mjs";
import { isPureExportBarrel } from "../../../../shared/is/pure-export-barrel.mjs";
import { collectJestPolicyFiles } from "./collect-policy-files.mjs";

export async function validateJestSourcePolicy(context = {}) {
  const root = context.root ?? process.cwd();
  const inventory = context.repositoryInventory;
  const harness = context.packageJson?.name === "@eliware/test";
  const applied = context.packageJson?.eliware?.apply ?? [];
  const main = context.packageJson?.main;
  const primaryEntry =
    typeof main === "string" && main.startsWith("./") ? posix.normalize(main.slice(2)) : null;
  const { errors, files, paths } = await collectJestPolicyFiles(inventory, root);
  for (const { path, content } of files) {
    const toolError = validateTestToolReferences(path, content, harness);
    const coverageError = validateProductionCoveragePolicy(path, content, {
      allowLibraryBarrel:
        applied.includes("library") && !applied.includes("application") && path === primaryEntry,
      pureExportBarrel: isPureExportBarrel(content),
    });
    if (toolError) errors.push(toolError);
    if (coverageError) errors.push(coverageError);
  }
  for (const path of findSeparateTestRunnerConfigs(paths ?? []))
    errors.push(`${path} is a separate test runner or coverage configuration file.`);
  return errors;
}
