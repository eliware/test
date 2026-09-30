import { expect, jest, test } from "@jest/globals";

const runLineLimits = jest.fn();
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/E-0.1.20/validate-line-limits.mjs",
  () => ({
    runLineLimits,
  }),
);
const { parentRuleId, ruleId, run } =
  await import("../../../../src/checks/application/E-0.1.130/E-0.1.130.10.mjs");

test("forwards application identity and requires mirrored tests", () => {
  const options = { root: "/repo", focusedScope: { paths: ["src/a.mjs"] } };
  const result = { status: "pass" };
  runLineLimits.mockReturnValueOnce(result);

  expect(ruleId).toBe("E-0.1.130.10");
  expect(parentRuleId).toBe("E-0.1.130");
  expect(run(options)).toBe(result);
  expect(runLineLimits).toHaveBeenCalledWith({ ...options, ruleId, requireTests: true });
});
