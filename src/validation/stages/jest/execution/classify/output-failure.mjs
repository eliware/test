import fail from "../../../../../checks/check-result/fail.mjs";

export default function classifyJestOutputFailure(ruleId, result) {
  if (result.outputRedacted)
    return fail(
      ruleId,
      `Jest output contained secret material. Redaction occurred in coverage/jest.log (${result.outputRedactionKinds?.join(", ") ?? "secret rule"}).`,
    );
  if (result.outputLogError)
    return fail(ruleId, "Jest output could not be saved to coverage/jest.log.");
  return null;
}
