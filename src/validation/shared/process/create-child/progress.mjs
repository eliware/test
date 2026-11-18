import createChildProgressHandler from "../handle-child/progress/create-child-progress-handler.mjs";
export default function createChildProgress(options, timeoutController, timeout, output) {
  const resetProgressTimer = () => {
    if (!options.isSettled()) timeout.reset();
  };
  return createChildProgressHandler({
    ...options,
    onSuiteStart: (path) =>
      timeoutController.suiteTimeout().start(path) || options.onSuiteStart?.(path),
    onSuiteEnd: (path) => timeoutController.suiteTimeout().end(path) || options.onSuiteEnd?.(path),
    resetProgressTimer,
    redactProgressText: output.redactComplete,
  });
}
