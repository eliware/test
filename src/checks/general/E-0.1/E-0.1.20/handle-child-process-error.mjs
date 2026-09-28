export function createChildProcessErrorHandler({
  isSettled,
  markSettled,
  getTimeout,
  getTermination,
  output,
  reject,
}) {
  return (error) => {
    if (isSettled()) return;
    markSettled();
    try {
      getTimeout()?.stop();
    } catch {}
    try {
      getTermination()?.cancel();
    } catch {}
    const diagnostic = output.redactComplete(
      error instanceof Error ? error.message : String(error),
    );
    reject(new Error(diagnostic || "Child process could not be started."));
  };
}
