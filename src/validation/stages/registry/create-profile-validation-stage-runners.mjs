import { executePackValidation } from "../pack/execute-pack-validation.mjs";
import { runNpmPack } from "../pack/run-npm-pack.mjs";
import { runNpmScript } from "../scripts/run-npm-script.mjs";
import { runNpmOutdated } from "../outdated/run-npm-outdated.mjs";
import { validateDirectToolScript } from "../scripts/validate-direct-tool-script.mjs";
import { createValidationStageResult } from "../shared/create-validation-stage-result.mjs";

export function createProfileValidationStageRunners({
  validatePack = executePackValidation,
  runPack = runNpmPack,
  runOutdated = runNpmOutdated,
  runScript = runNpmScript,
} = {}) {
  return {
    pack: async (context) => {
      if (!context.packageJson?.eliware?.apply?.includes("npm-published"))
        return createValidationStageResult("pack", 0, "Package validation does not apply.");
      try {
        let output;
        const message = await validatePack({
          root: context.root,
          packageJson: context.packageJson,
          executePack: context.executePack,
          mode: context.mode,
          runPack: async (...args) => {
            output = await runPack(...args);
            return output;
          },
          toolArgs: context.toolArgs,
        });
        return createValidationStageResult("pack", message ? 9 : 0, message ?? "", {
          message,
          output,
        });
      } catch (error) {
        return createValidationStageResult("pack", 9, error.message);
      }
    },
    outdated: async (context) => {
      try {
        const value = await runOutdated(context.root, { env: context.env ?? process.env });
        context.outdatedDependencies = value.dependencies;
        const message = value.outdated.length
          ? `Outdated packages: ${value.outdated.join(", ")}.`
          : "";
        return createValidationStageResult(
          "outdated",
          value.outdated.length ? 8 : 0,
          message,
          value,
        );
      } catch (error) {
        return createValidationStageResult("outdated", 8, error.message);
      }
    },
    typecheck: async (context) => runProfileScript("typecheck", 10, "library", context, runScript),
    build: async (context) => runProfileScript("build", 11, "web", context, runScript),
  };
}

async function runProfileScript(script, code, profile, context, runScript) {
  if (!context.packageJson?.eliware?.apply?.includes(profile))
    return createValidationStageResult(script, 0, `${script} does not apply.`);
  const command = context.packageJson?.scripts?.[script];
  if (typeof command !== "string" || !command.trim())
    return createValidationStageResult(script, 1, `${script} script is not configured.`);
  const configurationError = validateDirectToolScript(command, script);
  if (configurationError) return createValidationStageResult(script, 1, configurationError);
  try {
    const value = await runScript(
      context.root,
      script,
      undefined,
      undefined,
      context.env ?? process.env,
    );
    return createValidationStageResult(
      script,
      value.code === 0 ? 0 : code,
      value.code === 0 ? "" : `${script} failed.`,
      value,
    );
  } catch (error) {
    return createValidationStageResult(script, code, error.message);
  }
}
