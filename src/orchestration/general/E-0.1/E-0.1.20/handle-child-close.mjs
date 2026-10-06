export function createChildCloseHandler({
  isSettled,
  markSettled,
  flushOutput,
  timeout,
  termination,
  output,
  settleError,
  resolve,
}) {
  return (code, signal) => {
    if (isSettled()) return;
    flushOutput();
    timeout.stop();
    termination.cancel();
    const timedOut = termination.wasTimedOut();
    if (code === null && !timedOut) {
      settleError(
        new Error(`Child process exited without an exit code${signal ? ` (${signal})` : ""}.`),
      );
      return;
    }
    markSettled();
    resolve({
      code,
      signal,
      ...output.result(),
      ...(timedOut
        ? {
            timedOut: true,
            terminationRequested: true,
            terminationConfirmed: termination.terminationConfirmed(),
          }
        : {}),
    });
  };
}
