import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fail from "../check-result/fail.mjs";
import pass from "../check-result.mjs";
import validatePackageScriptPolicy from "./E-0.1.0.1.5/validate/package/script-policy.mjs";
import validatePrettierConfiguration from "./E-0.1.0.1.5/validate/prettier/configuration.mjs";
import validateFormattingStages from "./E-0.1.0.1.5/validate/formatting-stages.mjs";
import validateStandalonePrettierConfiguration from "./E-0.1.0.1.5/validate/standalone-prettier-configuration.mjs";
export const ruleId = "E-0.1.0.1.5";
const executeFile = promisify(execFile);
export default async function run(context = {}) {
  const errors = [
    ...validatePackageScriptPolicy(context.packageJson),
    ...validatePrettierConfiguration(context.packageJson),
    ...(await validateStandalonePrettierConfiguration(
      context.repositoryInventory,
      context.root ?? process.cwd(),
      context.runGit ?? executeFile,
    )),
    ...validateFormattingStages(context.stageResults),
  ];
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
