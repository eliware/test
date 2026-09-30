import { formatTestResult, formatTestStart } from "./format-jest-timing.mjs";
import {
  createSafeReporterOutput,
  repositoryRelativePath,
} from "../../../create-safe-reporter-output.mjs";

export default class JestTimingReporter {
  constructor(options = {}) {
    this.reportLine = createSafeReporterOutput("eliware-test", options);
  }

  onTestStart(test) {
    this.reportLine(formatTestStart(repositoryRelativePath(test.path)));
  }

  onTestResult(test, result) {
    const safeTest = { ...test, path: repositoryRelativePath(test.path) };
    for (const line of formatTestResult(safeTest, result)) this.reportLine(line);
  }
}
