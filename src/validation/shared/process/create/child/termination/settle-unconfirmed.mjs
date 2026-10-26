export function createUnconfirmedTerminationSettlement({
  isSettled,
  markSettled,
  timeout,
  output,
  resolve,
}) {
  return () => {
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
  };
}
