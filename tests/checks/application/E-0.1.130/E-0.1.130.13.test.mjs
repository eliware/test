import { expect, jest, test } from "@jest/globals";

const runJestStage = jest.fn();
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/run-jest-stage.mjs", () => ({
  runJestStage,
}));
const { executionPhase, focusedSafe, parentRuleId, ruleId, run } =
  await import("../../../../src/checks/application/E-0.1.130/E-0.1.130.13.mjs");

test("forwards application identity and context to the shared Jest stage", () => {
  const context = { executeJest: false };
  const result = { status: "pass" };
  runJestStage.mockReturnValueOnce(result);
  expect(parentRuleId).toBe("E-0.1.130");
  expect(focusedSafe).toBe(true);
  expect(executionPhase).toBe("jest");
  expect(run(context)).toBe(result);
  expect(runJestStage).toHaveBeenCalledWith(context, ruleId);
});
