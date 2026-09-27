import { expect, jest, test } from "@jest/globals";

const inspectTestProcessOutput = jest.fn();
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/E-0.1.20/inspect-test-process-output.mjs", () => ({ inspectTestProcessOutput }));
const { focusedSafe, parentRuleId, ruleId, run } = await import(
  "../../../../src/checks/library/E-0.1.40/E-0.1.40.17.mjs"
);

test("forwards library identity and context to shared output inspection", () => {
  const context = { executeJest: false };
  const result = { status: "pass" };
  inspectTestProcessOutput.mockReturnValueOnce(result);
  expect(parentRuleId).toBe("E-0.1.40");
  expect(focusedSafe).toBe(true);
  expect(run(context)).toBe(result);
  expect(inspectTestProcessOutput).toHaveBeenCalledWith(context, ruleId);
});
