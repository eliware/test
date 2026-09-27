import { expect, jest, test } from "@jest/globals";

const runCoverageCheck = jest.fn();
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/E-0.1.20/run-coverage-check.mjs",
  () => ({ runCoverageCheck }),
);
const { focusedSafe, parentRuleId, ruleId, run } =
  await import("../../../../src/checks/application/E-0.1.130/E-0.1.130.14.mjs");

test("forwards application identity and context to the shared coverage check", () => {
  const context = { executeJest: false };
  const result = { status: "pass" };
  runCoverageCheck.mockReturnValueOnce(result);
  expect(parentRuleId).toBe("E-0.1.130");
  expect(focusedSafe).toBe(true);
  expect(run(context)).toBe(result);
  expect(runCoverageCheck).toHaveBeenCalledWith(context, ruleId);
});
