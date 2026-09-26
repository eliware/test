import { formatTestResult, formatTestStart } from "./format-jest-timing.mjs";

function reportLine(message) {
  process.stderr.write(`[eliware-test] ${message}\n`);
}


export default class JestTimingReporter {
  onTestStart(test) {
    reportLine(formatTestStart(test.path));
  }

  onTestResult(test, result) {
    for (const line of formatTestResult(test, result)) reportLine(line);
  }
}
