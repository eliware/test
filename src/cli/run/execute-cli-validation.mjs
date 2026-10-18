import { readDiagnosticOptions } from "../read/diagnostic-options.mjs";
import { createStageTimer } from "../timing/create-stage-timer.mjs";
import { runConventionStage } from "../../validation/check-execution/run-convention-stage.mjs";
import { runValidation } from "../../validation/run-validation.mjs";
import { createValidationRunOptions } from "../create-validation-run-options.mjs";
import { writeValidationResults } from "../write/validation-results.mjs";
import { formatExitCode } from "../format-exit-code.mjs";
import { parseFocusedArguments } from "../parse/focused-arguments.mjs";
import { selectTimingOutput } from "../select-timing-output.mjs";

export async function executeCliValidation({ args, write, root, options }) {
  const diagnosticOptions = readDiagnosticOptions(args);
  const startedAt = Date.now();
  const validationSummary = {};
  const timingOutput = selectTimingOutput(args, write);
  const timing = createStageTimer(args.includes("--debug-timing"), () => Date.now(), timingOutput);
  const executeConvention = options.runConventionStage ?? runConventionStage;
  const executeValidation = options.runValidation ?? runValidation;
  const result = await executeConvention(() =>
    executeValidation(
      root,
      [],
      createValidationRunOptions(
        args,
        diagnosticOptions,
        { ...options, validationSummary },
        timing,
        timingOutput,
      ),
    ),
  );
  writeValidationResults(
    {
      ...result,
      validationSummary,
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
  return result.code;
}
