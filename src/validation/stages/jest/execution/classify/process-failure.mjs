import fail from "../../../../../checks/check-result/fail.mjs";
import parseActionableJestOutput from "../parse/actionable-output.mjs";
import parseFailedJestProgressOutput from "../parse/failed-progress-output.mjs";

export default function classifyJestProcessFailure(ruleId, result, timeoutDiagnostic) {
  if (timeoutDiagnostic && (result.timedOut || result.code !== 0))
    return fail(ruleId, formatJestFailure(timeoutDiagnostic, result));
  if (result.timedOut)
    return fail(
      ruleId,
      formatJestFailure(
        timeoutDiagnostic ?? "Jest timed out after 15 seconds without progress.",
        result,
      ),
    );
  if (result.code === 0) return null;
  const detail = [result.stdout, result.stderr]
    .map(parseActionableJestOutput)
    .filter(Boolean)
    .concat(
      parseFailedJestProgressOutput(result.stdout),
      parseFailedJestProgressOutput(result.stderr),
    )
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join("\n")
    .trim();
  const summary = readJestSummary(result);
  const hasPassOnlySummary = summary.some(
    (line) => /\b\d+ passed\b/u.test(line) && !/\b\d+ failed\b/u.test(line),
  );
  const hasFailedSummary = summary.some((line) => /\b\d+ failed\b/u.test(line));
  const message = detail
    ? `Jest failed: ${detail}`
    : hasPassOnlySummary
      ? `Jest reported passing tests but exited unsuccessfully.\n${summary.join("\n")}`
      : hasFailedSummary
        ? `Jest exited with a failure summary:\n${summary.join("\n")}`
        : summary.length
          ? `Jest exited with no reported test failures. Captured summary:\n${summary.join("\n")}`
          : "Jest exited without reported test failures or actionable output.";
  return fail(ruleId, formatJestFailure(message, result));
}

function formatJestFailure(message, result) {
  const processDetails = [
    result.code === null || result.code === undefined ? undefined : `exit code ${result.code}`,
    result.signal ? `signal ${result.signal}` : undefined,
    result.timedOut ? "timed out" : undefined,
    result.terminationConfirmed === true ? "termination confirmed" : undefined,
    result.terminationConfirmed === false ? "termination not confirmed" : undefined,
  ]
    .filter(Boolean)
    .join(", ");
  return [
    message,
    processDetails ? `Process: ${processDetails}.` : undefined,
    "Full output: coverage/jest.log.",
  ]
    .filter(Boolean)
    .join("\n");
}

function readJestSummary(result) {
  return [result.stdout, result.stderr]
    .flatMap((text) => String(text ?? "").split(/\r?\n/u))
    .map((line) => line.trim())
    .filter((line) =>
      /^(?:PASS\s|Test Suites:|Tests:|Snapshots:|Time:|Ran all test suites)/u.test(line),
    )
    .slice(0, 6);
}
