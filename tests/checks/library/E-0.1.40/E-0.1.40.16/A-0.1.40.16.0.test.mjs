import { expect, jest, test } from "@jest/globals";

const runCoverageExemptionCheck = jest.fn();
jest.unstable_mockModule("../../../../../src/checks/general/E-0.1/E-0.1.20/validate-coverage-exemptions.mjs", () => ({
  runCoverageExemptionCheck,
}));
const { parentRuleId, ruleId, run } = await import(
  "../../../../../src/checks/library/E-0.1.40/E-0.1.40.16/A-0.1.40.16.0.mjs"
);

test("forwards library exemption and coverage rule identities", () => {
  const context = { packageJson: {} };
  const result = { status: "pass" };
  runCoverageExemptionCheck.mockReturnValueOnce(result);
  expect(parentRuleId).toBe("E-0.1.40.16");
  expect(run(context)).toBe(result);
  expect(runCoverageExemptionCheck).toHaveBeenCalledWith(context, {
    ruleId,
    coverageRuleId: parentRuleId,
  });
});
