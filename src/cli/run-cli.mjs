import { readDiagnosticOptions } from "./read-diagnostic-options.mjs";
import { createStageTimer } from "./timing/create-stage-timer.mjs";
import { runConventionStage } from "../orchestrators/run-convention-stage.mjs";
import { runValidation } from "../orchestrators/run-validation.mjs";
import { dispatchInformationalCommand } from "./dispatch-informational-command.mjs";
import { createValidationRunOptions } from "./create-validation-run-options.mjs";
import { writeValidationResults } from "./write-validation-results.mjs";
import { normalizeCliError } from "./normalize-cli-error.mjs";
import { formatExitCode } from "./format-exit-code.mjs";
import { parseFocusedArguments } from "./parse-focused-arguments.mjs";
import { acquireValidationLock } from "./acquire-validation-lock.mjs";
import { completeCliValidation } from "./complete-cli-validation.mjs";
import { runNpmPrerequisite } from "./run-npm-prerequisite.mjs";
import { join } from "node:path";

export async function runCli(args, write = console.log, root = process.cwd(), options = {}) {
  let releaseLock;
  try {
    const informationalResult = dispatchInformationalCommand(args, write);
    if (informationalResult !== null) return informationalResult;
    if (!(await (options.runNpmPrerequisite ?? runNpmPrerequisite)(write))) return 18;
    const lockPath = join(root, "eliware-test.lock");
    releaseLock = await (options.acquireValidationLock ?? acquireValidationLock)(root);
    if (!releaseLock) {
      write(
        `Cannot run eliware-test because the lock file exists: ${lockPath}. If no validation run is active, remove the stale lock file and retry.`,
      );
      return 18;
    }
    let resultCode;
    let validationError;
    try {
      const diagnosticOptions = readDiagnosticOptions(args);
      const startedAt = Date.now();
      const timingOutput = args.includes("--debug-timing")
        ? write === console.log
          ? process.stdout.write.bind(process.stdout)
          : write
        : undefined;
      const timing = createStageTimer(
        args.includes("--debug-timing"),
        () => Date.now(),
        timingOutput,
      );
      const executeConvention = options.runConventionStage ?? runConventionStage;
      const executeValidation = options.runValidation ?? runValidation;
      const result = await executeConvention(() =>
        executeValidation(
          root,
          [],
          createValidationRunOptions(args, diagnosticOptions, options, timing, timingOutput),
        ),
      );
      writeValidationResults(
        {
          ...result,
          mode:
            diagnosticOptions.mode ??
            (parseFocusedArguments(diagnosticOptions.jestArgs ?? []).positional.length > 0
              ? "focused"
              : null),
        },
        write,
        args.includes("--debug-timing"),
        startedAt,
      );
      if (result.code !== 0 || args.includes("--debug-timing")) write(formatExitCode(result.code));
      resultCode = result.code;
    } catch (error) {
      validationError = error;
    }
    const releaseLockForRun = releaseLock;
    releaseLock = undefined;
    return completeCliValidation({
      resultCode,
      validationError,
      releaseLock: releaseLockForRun,
      reportError: (error) => reportCliError(error, write),
    });
  } catch (error) {
    return reportCliError(error, write);
  }
}

function reportCliError(error, write) {
  const exitCode = normalizeCliError(error, write);
  write(formatExitCode(exitCode));
  return exitCode;
}
