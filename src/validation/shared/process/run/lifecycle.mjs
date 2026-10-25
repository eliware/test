import { createChildTerminationHandler } from "../create/child/termination-handler.mjs";
import { createChildProgress } from "../create-child/progress.mjs";
import { createChildCloseHandler } from "../handle-child/close.mjs";
import { wireChildOutput } from "../wire-child-output.mjs";

export function registerChildLifecycle(
  child,
  {
    options,
    environment,
    timeout,
    timeoutController,
    output,
    resolve,
    isSettled,
    markSettled,
    settleError,
    setTermination,
  },
) {
  timeoutController.start();
  const termination = createChildTerminationHandler({
    child,
    options,
    environment,
    timeout,
    output,
    resolve,
    isSettled,
    markSettled,
  });
  setTermination(termination);
  const progress = createChildProgress(
    { ...options, isSettled },
    timeoutController,
    timeout,
    output,
  );
  timeout.reset();
  const flushOutput = wireChildOutput(child, output, progress);
  const handleClose = createChildCloseHandler({
    isSettled,
    markSettled,
    flushOutput,
    timeout,
    termination,
    output,
    settleError,
    resolve,
  });
  child.on("error", settleError);
  child.on("close", handleClose);
  return termination;
}
