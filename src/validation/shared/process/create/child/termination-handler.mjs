import { terminateChild } from "../../terminate/child.mjs";
import { scheduleChildTermination } from "../../schedule-child-termination.mjs";
import { createUnconfirmedTerminationSettlement } from "./termination/settle-unconfirmed.mjs";

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
  const settleUnconfirmed = createUnconfirmedTerminationSettlement({
    isSettled,
    markSettled,
    timeout,
    output,
    resolve,
  });
  return {
    onTimeout(notify = true) {
      if (isSettled()) return;
      timeout.stop();
      timedOut = true;
      if (notify) {
        try {
          options.onTimeout?.();
        } catch {}
      }
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
}
