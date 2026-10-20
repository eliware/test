import { dispatchInformationalCommand } from "../dispatch-informational-command.mjs";
import { reportCliError } from "../report-cli-error.mjs";
import { acquireValidationLock } from "../acquire-validation-lock.mjs";
import { completeCliValidation } from "../complete-cli-validation.mjs";
import { runNpmPrerequisite } from "./npm-prerequisite.mjs";
import { join } from "node:path";
import { executeCliValidation } from "./execute-cli-validation.mjs";
import { createStageTimer } from "../timing/create/stage-timer.mjs";
import { createTimingLog } from "../timing/create/timing-log.mjs";
import { selectTimingOutput } from "../select-timing-output.mjs";

export async function runCli(args, write = console.log, root = process.cwd(), options = {}) {
  let releaseLock;
  try {
    const informationalResult = dispatchInformationalCommand(args, write);
    if (informationalResult !== null) return informationalResult;
    const startedAt = Date.now();
    const consoleTiming = selectTimingOutput(args, write);
    consoleTiming?.(`Started: ${new Date(startedAt).toISOString()}\n`);
    const queuedTiming = [];
    let logTiming;
    const timingOutput = (text) => {
      if (logTiming) logTiming(text);
      else queuedTiming.push(text);
      consoleTiming?.(text);
    };
    const timing = createStageTimer(true, () => Date.now(), timingOutput, startedAt);
    timing.stage("npm prerequisite");
    if (!(await (options.runNpmPrerequisite ?? runNpmPrerequisite)(write))) return 1;
    const lockPath = join(root, "eliware-test.lock");
    timing.stage("validation lock");
    releaseLock = await (options.acquireValidationLock ?? acquireValidationLock)(root);
    if (!releaseLock) {
      write(
        `Cannot run eliware-test because the lock file exists: ${lockPath}. ` +
          "If no validation run is active, remove the stale lock file and retry.",
      );
      return 1;
    }
    let resultCode;
    let validationError;
    try {
      logTiming = (options.createTimingLog ?? createTimingLog)(root, startedAt);
      for (const text of queuedTiming) logTiming(text);
      queuedTiming.length = 0;
      timing.stage("validation");
      resultCode = await executeCliValidation({
        args,
        write,
        root,
        options,
        startedAt,
        timing,
        timingOutput,
      });
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
