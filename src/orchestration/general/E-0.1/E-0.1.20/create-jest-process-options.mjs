import { createJestEnvironment } from "./create-jest-environment.mjs";
import { createJestProgressTracker } from "./create-jest-progress-tracker.mjs";
import { formatJestSuiteProgress } from "./format-jest-suite-progress.mjs";

export function createJestProcessOptions(root, args = [], options = {}) {
  const invokingEnvironment = options.env ?? process.env;
  const progress = createJestProgressTracker();
  const env = createJestEnvironment(invokingEnvironment);
  let nestedOutputStarted = false;
  if (options.consoleReportFile) env.ELIWARE_TEST_JEST_CONSOLE_REPORT = options.consoleReportFile;
  return {
    // codescope ignore: every Jest invocation runs from its owning consumer repository root so Jest discovers that repository's configuration and tests
    cwd: root,
    env,
    progressPattern: /^\[eliware-test-progress\]/m,
    progressTimeoutMs: 15_000,
    suiteTimeoutMs: 5_000,
    onProgress(text) {
      for (const event of progress.readProgress(text)) {
        if (event.event === "start") this.onSuiteStart?.(event.path);
        if (event.event === "result") this.onSuiteEnd?.(event.path);
        if (event.event === "start" && !nestedOutputStarted) {
          options.beginNestedOutput?.();
          nestedOutputStarted = true;
        }
        for (const output of formatJestSuiteProgress(event)) options.writeOutput?.(output);
      }
    },
    onTimeout: () => options.onTimeout?.(progress.timeoutMessage()),
    onSuiteTimeout(path) {
      options.onTimeout?.(`Test suite ${path} exceeded its 5 second maximum runtime.`);
    },
    maxOutputLength: 1_000_000,
    ...(typeof options.writeOutput === "function"
      ? { maxProgressLineLength: Number.MAX_SAFE_INTEGER }
      : {}),
    ...(options.onStderr ? { onStderr: options.onStderr } : {}),
  };
}
