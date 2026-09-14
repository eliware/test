import { fail, pass } from "../../../check-result.mjs";

export function classifyJestResult(ruleId, result, timeoutDiagnostic) {
  if (result.timedOut) {
    return fail(ruleId, timeoutDiagnostic ?? "Jest timed out after 15 seconds without progress.");
  }
  if (result.code !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    return fail(ruleId, detail ? `Jest failed: ${detail}` : "Jest failed without diagnostics.");
  }
  return pass(ruleId);
}
