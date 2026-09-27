import { expect, jest, test } from "@jest/globals";

const runJestStage = jest.fn();
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/run-jest-stage.mjs", () => ({ runJestStage }));
const { focusedSafe, parentRuleId, ruleId, run } = await import(
  "../../../../src/checks/library/E-0.1.40/E-0.1.40.15.mjs"
);

test("forwards library identity and context to the shared Jest stage", () => {
  const context = { executeJest: false };
  const result = { status: "pass" };
  runJestStage.mockReturnValueOnce(result);
  expect(parentRuleId).toBe("E-0.1.40");
  expect(focusedSafe).toBe(true);
  expect(run(context)).toBe(result);
  expect(runJestStage).toHaveBeenCalledWith(context, ruleId);
});
