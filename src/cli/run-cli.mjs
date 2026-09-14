import { readDiagnosticOptions } from "./read-diagnostic-options.mjs";
import { createStageTimer } from "./timing/create-stage-timer.mjs";
import { runConventionStage } from "../orchestrators/run-convention-stage.mjs";
import { runValidation } from "../orchestrators/run-validation.mjs";
import { dispatchInformationalCommand } from "./dispatch-informational-command.mjs";
import { createValidationRunOptions } from "./create-validation-run-options.mjs";
import { writeValidationResults } from "./write-validation-results.mjs";
import { normalizeCliError } from "./normalize-cli-error.mjs";

export async function runCli(args, write = console.log, root = process.cwd(), options = {}) {
  const informationalResult = dispatchInformationalCommand(args, write);
  if (informationalResult !== null) return informationalResult;
  try {
    const startedAt = Date.now();
    const diagnosticOptions = readDiagnosticOptions(args);
    const timing = createStageTimer(args.includes("--debug-timing"));
    const executeConvention = options.runConventionStage ?? runConventionStage;
    const executeValidation = options.runValidation ?? runValidation;
    const result = await executeConvention(() => executeValidation(
      root,
      diagnosticOptions.ignoredRuleIds,
      createValidationRunOptions(args, diagnosticOptions, options, timing, write),
    ));
    writeValidationResults(result, write, args.includes("--debug-timing"), timing, startedAt);
    return result.code;
  } catch (error) {
    return normalizeCliError(error, write);
  }
}
