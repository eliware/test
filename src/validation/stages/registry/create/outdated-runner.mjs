import { runNpmOutdated } from "../../outdated/run-npm-outdated.mjs";
import { createValidationStageResult } from "../../shared/create-validation-stage-result.mjs";

export function createOutdatedRunner(runOutdated = runNpmOutdated) {
  return async (context) => {
    try {
      const value = await runOutdated(context.root, { env: context.env ?? process.env });
      context.outdatedDependencies = value.dependencies;
      const message = value.outdated.length
        ? `Outdated packages: ${value.outdated.join(", ")}.`
        : "";
      return createValidationStageResult("outdated", value.outdated.length ? 8 : 0, message, value);
    } catch (error) {
      return createValidationStageResult("outdated", 8, error.message);
    }
  };
}
