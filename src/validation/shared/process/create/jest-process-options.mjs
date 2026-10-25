import { createJestEnvironment } from "../../../stages/jest/configuration/create-jest/environment.mjs";
import { createJestProgressTracker } from "../../../stages/jest/progress/create/jest/progress-tracker.mjs";
import { formatJestSuiteProgress } from "../../../stages/format/jest-suite-progress.mjs";

export function createJestProcessOptions(root, args = [], options = {}) {
  const invokingEnvironment = options.env ?? process.env;
  const progress = createJestProgressTracker();
  const env = createJestEnvironment(invokingEnvironment);
  let nestedOutputStarted = false;
  if (options.consoleReportFile) env.ELIWARE_TEST_JEST_CONSOLE_REPORT = options.consoleReportFile;
  return {
    cwd: root,
    env,
    progressPattern: /^\[eliware-test-progress\]/m,
    progressTimeoutMs: 15_000,
    suiteTimeoutMs: 10_000,
    onProgress(text) {
      for (const event of progress.readProgress(text)) {
        if (event.event === "start") this.onSuiteStart?.(event.path);
        if (event.event === "result") this.onSuiteEnd?.(event.path);
        if (event.event === "start" && !nestedOutputStarted) {
          options.beginNestedOutput?.();
          nestedOutputStarted = true;
        }
        const formattedOutput = formatJestSuiteProgress(event, options.elapsed?.());
        for (const output of formattedOutput) options.writeOutput?.(output);
      }
    },
    onTimeout: () => options.onTimeout?.(progress.timeoutMessage()),
    onSuiteTimeout(path) {
      options.onTimeout?.(`Test suite ${path} exceeded its 10 second maximum runtime.`);
    },
    maxOutputLength: 1_000_000,
    ...(typeof options.writeOutput === "function"
      ? { maxProgressLineLength: Number.MAX_SAFE_INTEGER }
      : {}),
    ...(options.onStderr ? { onStderr: options.onStderr } : {}),
    ...(options.onRawStdout ? { onRawStdout: options.onRawStdout } : {}),
    ...(options.onRawStderr ? { onRawStderr: options.onRawStderr } : {}),
  };
}
