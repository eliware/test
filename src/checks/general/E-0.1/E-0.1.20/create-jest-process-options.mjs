import { createJestEnvironment } from "./create-jest-environment.mjs";
import { createJestProgressTracker } from "./create-jest-progress-tracker.mjs";

export function createJestProcessOptions(root, args = [], options = {}) {
  const invokingEnvironment = options.env ?? process.env;
  const progress = createJestProgressTracker();
  const env = createJestEnvironment(invokingEnvironment);
  if (options.consoleReportFile) env.ELIWARE_TEST_JEST_CONSOLE_REPORT = options.consoleReportFile;
  return {
    // codescope ignore: every Jest invocation runs from its owning consumer repository root so Jest discovers that repository's configuration and tests
    cwd: root,
    env,
    progressPattern: /^\[eliware-test-progress\]/m,
    resetOnAnyOutput: true,
    progressTimeoutMs: 15_000,
    onProgress: progress.readProgress,
    onTimeout: () => options.onTimeout?.(progress.timeoutMessage()),
    ...(args.includes("--debug-timing") ? { maxOutputLength: 1_000_000 } : {}),
    ...(options.onStderr ? { onStderr: options.onStderr } : {}),
  };
}
