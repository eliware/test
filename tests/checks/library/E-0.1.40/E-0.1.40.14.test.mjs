import { expect, jest, test } from "@jest/globals";

const runPureExportBarrelPolicy = jest.fn();
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/E-0.1.20/validate-pure-export-barrels.mjs",
  () => ({
    runPureExportBarrelPolicy,
  }),
);
const { parentRuleId, repositoryInventoryOptions, ruleId, run } =
  await import("../../../../src/checks/library/E-0.1.40/E-0.1.40.14.mjs");

test("forwards library identity and source inventory requirements", () => {
  const options = { root: "/repo", packageJson: {} };
  const result = { status: "pass" };
  runPureExportBarrelPolicy.mockReturnValueOnce(result);
  expect(ruleId).toBe("E-0.1.40.14");
  expect(parentRuleId).toBe("E-0.1.40");
  expect(repositoryInventoryOptions).toEqual({ includeTestResultsUnder: ["src"] });
  expect(run(options)).toBe(result);
  expect(runPureExportBarrelPolicy).toHaveBeenCalledWith({ ...options, ruleId });
});
