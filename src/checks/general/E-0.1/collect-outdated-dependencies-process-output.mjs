import { createOutdatedDependenciesOutput } from "./create-outdated-dependencies-output.mjs";
import { createOutdatedDependenciesOverflowHandler } from "./create-outdated-dependencies-overflow-handler.mjs";

export function collectOutdatedDependenciesProcessOutput(
  child,
  {
    maxStdoutLength,
    maxStderrLength,
    terminationGracePeriodMs,
    terminateProcess,
    platform,
    killProcess,
    killTree,
    env,
  },
) {
  return new Promise((resolve, reject) => {
    const output = createOutdatedDependenciesOutput(maxStdoutLength, maxStderrLength);
    let oversized = false;
    let settled = false;
    let overflowHandler;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      overflowHandler?.cancel();
      reject(error);
    };
    const resolveOnce = (value) => {
      if (settled) return;
      settled = true;
      overflowHandler?.cancel();
      resolve(value);
    };
    const rejectStreamError = (error) => {
      if (settled) return;
      overflowHandler.start();
      rejectOnce(error);
    };

    overflowHandler = createOutdatedDependenciesOverflowHandler({
      child,
      maxOutputLength: maxStdoutLength,
      terminationGracePeriodMs,
      terminateProcess,
      platform,
      killProcess,
      killTree,
      env,
      onGracePeriodExpired: rejectOnce,
    });
    child.stdout.on("data", (chunk) => {
      if (oversized || settled) return;
      if (output.appendStdout(chunk)) return;
      oversized = true;
      overflowHandler.start();
    });
    child.stderr.on("data", (chunk) => output.appendStderr(chunk));
    child.stdout.on("error", rejectStreamError);
    child.stderr.on("error", rejectStreamError);
    child.on("error", rejectOnce);
    child.on("close", (code) => {
      if (oversized) return rejectOnce(overflowHandler.createError());
      resolveOnce({ stdout: output.stdout, stderr: output.stderr, code });
    });
  });
}
