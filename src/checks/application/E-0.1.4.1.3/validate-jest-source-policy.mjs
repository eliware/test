import { join, posix } from "node:path";
import { findSeparateTestRunnerConfigs } from "./find-separate-test-runner-configs.mjs";
import { validateProductionCoveragePolicy } from "./validate-production-coverage-policy.mjs";
import { validateTestToolReferences } from "./validate-test-tool-references.mjs";
import { isPureExportBarrel } from "../E-0.1.4.1.2/validate-internal-export-barrels.mjs";

export async function validateJestSourcePolicy(context = {}) {
  const root = context.root ?? process.cwd();
  const inventory = context.repositoryInventory;
  const harness = context.packageJson?.name === "@eliware/test";
  const applied = context.packageJson?.eliware?.apply ?? [];
  const main = context.packageJson?.main;
  const primaryEntry =
    typeof main === "string" && main.startsWith("./") ? posix.normalize(main.slice(2)) : null;
  let files;
  try {
    files = await inventory.files("all");
  } catch {
    return ["Jest source policy could not read the repository inventory."];
  }
  const errors = [];
  for (const path of files) {
    if (!isPolicyFile(path)) continue;
    let content;
    try {
      content = await inventory.readText(join(root, path));
    } catch {
      errors.push(`${path} could not be read to check Jest source policy.`);
      continue;
    }
    const toolError = validateTestToolReferences(path, content, harness);
    const coverageError = validateProductionCoveragePolicy(path, content, {
      allowLibraryBarrel:
        applied.includes("library") && !applied.includes("application") && path === primaryEntry,
      pureExportBarrel: isPureExportBarrel(content),
    });
    if (toolError) errors.push(toolError);
    if (coverageError) errors.push(coverageError);
  }
  for (const path of findSeparateTestRunnerConfigs(files))
    errors.push(`${path} is a separate test runner or coverage configuration file.`);
  return errors;
}

function isPolicyFile(path) {
  if (path === "package.json") return true;
  const codeFile = /\.(?:mjs|js|cjs|jsx|ts|tsx|cts|mts|mjsx|cjsx|sh|ps1|py)$/iu.test(path);
  const configurationFile = /(?:config|rc|opts)(?:\.[^.]+)?$/iu.test(path.split("/").at(-1));
  return (/^(?:src|tests|bin|scripts|examples)\//u.test(path) && codeFile) || configurationFile;
}
