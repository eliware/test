import { terminateChild } from "./terminate-child.mjs";
import { scheduleChildTermination } from "./schedule-child-termination.mjs";

export function createChildTerminationHandler({
  child,
  options,
  environment,
  timeout,
  output,
  resolve,
  isSettled,
  markSettled,
}) {
  let timedOut = false;
  let terminationConfirmed = false;
  let cancelTermination;
  return {
    onTimeout() {
      if (isSettled()) return;
      timeout.stop();
      timedOut = true;
      try {
        options.onTimeout?.();
      } catch {}
      cancelTermination = scheduleChildTermination(
        child,
        {
          terminateChild: options.terminateChild ?? terminateChild,
          platform: options.terminationPlatform ?? process.platform,
          killProcess: options.killProcess ?? process.kill,
          killTree: options.killTree,
          environment,
          terminationGraceMs: options.terminationGraceMs ?? 1000,
          forceKillConfirmationMs: options.forceKillConfirmationMs ?? 1000,
        },
        settleUnconfirmed,
        (confirmed) => {
          terminationConfirmed = confirmed;
        },
      );
    },
    cancel() {
      cancelTermination?.();
    },
    wasTimedOut() {
      return timedOut;
    },
    terminationConfirmed() {
      return terminationConfirmed;
    },
  };

  function settleUnconfirmed() {
    if (isSettled()) return;
    markSettled();
    timeout.stop();
    output.flush();
    resolve({
      code: null,
      signal: "SIGKILL",
      ...output.result(),
      timedOut: true,
      terminationRequested: true,
      terminationConfirmed: false,
    });
  }
}
