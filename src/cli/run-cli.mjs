import { readDiagnosticOptions } from "./read-diagnostic-options.mjs";
import { createStageTimer } from "./timing/create-stage-timer.mjs";
import { runConventionStage } from "../orchestrators/run-convention-stage.mjs";
import { runValidation } from "../orchestrators/run-validation.mjs";
import { dispatchInformationalCommand } from "./dispatch-informational-command.mjs";
import { createValidationRunOptions } from "./create-validation-run-options.mjs";
import { writeValidationResults } from "./write-validation-results.mjs";
import { normalizeCliError } from "./normalize-cli-error.mjs";
import { formatExitCode } from "./format-exit-code.mjs";

export async function runCli(args, write = console.log, root = process.cwd(), options = {}) {
  try {
    const diagnosticOptions = readDiagnosticOptions(args);
    const informationalResult = dispatchInformationalCommand(args, write);
    if (informationalResult !== null) return informationalResult;
    const startedAt = Date.now();
    const timing = createStageTimer(
      args.includes("--debug-timing"),
      () => Date.now(),
      args.includes("--debug-timing") ? write : undefined,
    );
    const executeConvention = options.runConventionStage ?? runConventionStage;
    const executeValidation = options.runValidation ?? runValidation;
    const result = await executeConvention(() => executeValidation(
      root,
      diagnosticOptions.ignoredRuleIds,
      createValidationRunOptions(args, diagnosticOptions, options, timing, write),
    ));
    writeValidationResults(result, write, args.includes("--debug-timing"), timing, startedAt);
    if (result.code !== 0 || args.includes("--debug-timing")) write(formatExitCode(result.code));
    return result.code;
  } catch (error) {
    const exitCode = normalizeCliError(error, write);
    write(formatExitCode(exitCode));
    return exitCode;
  }
}
