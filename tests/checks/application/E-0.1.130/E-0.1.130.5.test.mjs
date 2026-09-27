import { expect, jest, test } from "@jest/globals";

const runNoCoverageIgnore = jest.fn();
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/validate-no-coverage-ignore.mjs", () => ({
  runNoCoverageIgnore,
}));
const { parentRuleId, repositoryInventoryOptions, ruleId, run } = await import(
  "../../../../src/checks/application/E-0.1.130/E-0.1.130.5.mjs"
);

test("forwards application identity and source inventory requirements", () => {
  const options = { root: "/repo", packageJson: {} };
  const result = { status: "pass" };
  runNoCoverageIgnore.mockReturnValueOnce(result);
  expect(ruleId).toBe("E-0.1.130.5");
  expect(parentRuleId).toBe("E-0.1.130");
  expect(repositoryInventoryOptions).toEqual({ includeTestResultsUnder: ["src"] });
  expect(run(options)).toBe(result);
  expect(runNoCoverageIgnore).toHaveBeenCalledWith({ ...options, ruleId });
});
