import { fail, pass } from "../../orchestration/check-result.mjs";
import { validatePackageScripts } from "./E-0.1.0.1.5/validate-package-scripts.mjs";
import { validatePrettierConfiguration } from "./E-0.1.0.1.5/validate-prettier-configuration.mjs";
import { validateFormattingStages } from "./E-0.1.0.1.5/validate-formatting-stages.mjs";
import { validateStandalonePrettierConfiguration } from "./E-0.1.0.1.5/validate-standalone-prettier-configuration.mjs";

export const ruleId = "E-0.1.0.1.5";

export async function run(context = {}) {
  const errors = [
    ...validatePackageScripts(context.packageJson),
    ...validatePrettierConfiguration(context.packageJson),
    ...(await validateStandalonePrettierConfiguration(
      context.repositoryInventory,
      context.root ?? process.cwd(),
    )),
    ...validateFormattingStages(context.stageResults),
  ];
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
