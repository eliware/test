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
    .split(/\r?\n/)
    .filter((line) => line.trim() && !ROUTINE_JEST_OUTPUT.some((pattern) => pattern.test(line.trim())))
    .join("\n")
    .trim();
}

export function classifyJestResult(ruleId, result, timeoutDiagnostic) {
  if (result.timedOut) {
    return fail(ruleId, timeoutDiagnostic ?? "Jest timed out after 15 seconds without progress.");
  }
  if (result.code !== 0) {
    const detail = [result.stdout, result.stderr].map(actionableJestOutput).filter(Boolean).join("\n").trim();
    return fail(ruleId, detail ? `Jest failed: ${detail}` : "Jest failed without diagnostics.");
  }
  return pass(ruleId);
}
