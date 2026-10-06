import { fail, pass } from "../../../check-result.mjs";

const ROUTINE_JEST_OUTPUT = [
  /^(?:PASS|Test Suites:|Tests:|Snapshots:|Time:|Ran all test suites)/u,
  /^Coverage summary/u,
  /^File\s+\|/u,
  /^[-|\s%_.]+$/u,
  /^\s*(?:All files|[^\s|]+)\s+\|/u,
  /^\[eliware-test(?:-progress)?\]/u,
];

function actionableJestOutput(text) {
  return String(text ?? "")
    .split(/\r?\nSummary of all failing tests\r?\n/u, 1)[0]
    .split(/\r?\n/)
    .filter(
      (line) => line.trim() && !ROUTINE_JEST_OUTPUT.some((pattern) => pattern.test(line.trim())),
    )
    .join("\n")
    .trim();
}

function failedProgressOutput(text) {
  return String(text ?? "")
    .split(/\r?\n/u)
    .flatMap((line) => {
      const marker = line.match(/^\[eliware-test-progress\] (.+)$/u);
      if (!marker) return [];
      try {
        const event = JSON.parse(marker[1]);
        if (event.event !== "result" || !event.failed) return [];
        return [
          [event.path, ...(event.failures ?? []), ...(event.unexpectedOutput ?? [])]
            .filter(Boolean)
            .join("\n"),
        ];
      } catch {
        return [];
      }
    })
    .filter(Boolean)
    .join("\n");
}

export function classifyJestResult(
  ruleId,
  result,
  timeoutDiagnostic,
  { failuresReported = false } = {},
) {
  if (timeoutDiagnostic && (result.timedOut || result.code !== 0))
    return fail(ruleId, timeoutDiagnostic);
  if (result.timedOut) {
    return fail(ruleId, timeoutDiagnostic ?? "Jest timed out after 15 seconds without progress.");
  }
  if (result.code !== 0) {
    if (failuresReported) return fail(ruleId, "Jest failed; see the inline suite failures above.");
    const detail = [result.stdout, result.stderr]
      .map(actionableJestOutput)
      .filter(Boolean)
      .concat(failedProgressOutput(result.stdout), failedProgressOutput(result.stderr))
      .filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index)
      .join("\n")
      .trim();
    const exitDetails = [
      result.code === null || result.code === undefined ? undefined : `code ${result.code}`,
      result.signal ? `signal ${result.signal}` : undefined,
    ]
      .filter(Boolean)
      .join(", ");
    const fallback = exitDetails
      ? `Jest exited with no captured output (${exitDetails}).`
      : "Jest failed without diagnostics.";
    return fail(ruleId, detail ? `Jest failed: ${detail}` : fallback);
  }
  return pass(ruleId);
}
