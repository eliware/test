import { fail, pass } from "../../../../checks/check-result.mjs";
import { parseActionableJestOutput } from "./parse/actionable-output.mjs";
import { parseFailedJestProgressOutput } from "./parse/failed-progress-output.mjs";

export function classifyJestResult(ruleId, result, timeoutDiagnostic) {
  if (result.outputRedacted)
    return fail(
      ruleId,
      `Jest output contained secret material. Redaction occurred in coverage/jest.log (${result.outputRedactionKinds?.join(", ") ?? "secret rule"}).`,
    );
  if (result.outputLogError)
    return fail(ruleId, "Jest output could not be saved to coverage/jest.log.");
  if (timeoutDiagnostic && (result.timedOut || result.code !== 0))
    return fail(ruleId, timeoutDiagnostic);
  if (result.timedOut) {
    return fail(ruleId, timeoutDiagnostic ?? "Jest timed out after 15 seconds without progress.");
  }
  if (result.code !== 0) {
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
