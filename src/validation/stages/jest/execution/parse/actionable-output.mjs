const ROUTINE_JEST_OUTPUT = [
  /^(?:PASS|Test Suites:|Tests:|Snapshots:|Time:|Ran all test suites)/u,
  /^Coverage summary/u,
  /^File\s+\|/u,
  /^[-|\s%_.]+$/u,
  /^\s*(?:All files|[^\s|]+)\s+\|/u,
  /^\[eliware-test(?:-progress)?\]/u,
];

export function parseActionableJestOutput(text) {
  return String(text ?? "")
    .split(/\r?\nSummary of all failing tests\r?\n/u, 1)[0]
    .split(/\r?\n/)
    .filter(
      (line) => line.trim() && !ROUTINE_JEST_OUTPUT.some((pattern) => pattern.test(line.trim())),
    )
    .join("\n")
    .trim();
}
