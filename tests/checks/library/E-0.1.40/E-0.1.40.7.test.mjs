import { expect, jest, test } from "@jest/globals";

const collectRepositoryFiles = jest.fn();
const runSourceTestMirroring = jest.fn();
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/collect-repository-files.mjs", () => ({ collectRepositoryFiles }));
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/validate-source-test-mirroring.mjs", () => ({ runSourceTestMirroring }));
const { collect, focusedSafe, parentRuleId, repositoryInventoryOptions, ruleId, run } = await import(
  "../../../../src/checks/library/E-0.1.40/E-0.1.40.7.mjs"
);

test("wires library identity, focused scope, inventory, and collection", () => {
  const context = { root: "/repo", focusedScope: { paths: ["src/a.mjs"] }, repositoryInventory: {} };
  const result = { status: "pass" };
  runSourceTestMirroring.mockReturnValueOnce(result);
  expect(ruleId).toBe("E-0.1.40.7");
  expect(parentRuleId).toBe("E-0.1.40");
  expect(focusedSafe).toBe(true);
  expect(repositoryInventoryOptions).toEqual({ expandedDirectories: ["src", "tests"], includeTestResultsUnder: ["src", "tests"] });
  expect(collect).toBe(collectRepositoryFiles);
  expect(run(context)).toBe(result);
  expect(runSourceTestMirroring).toHaveBeenCalledWith({
    root: context.root,
    ruleId,
    focusedScope: context.focusedScope,
    repositoryInventory: context.repositoryInventory,
  });
  run({ root: "/repo" });
  expect(runSourceTestMirroring).toHaveBeenLastCalledWith({
    root: "/repo",
    ruleId,
    focusedScope: null,
    repositoryInventory: undefined,
  });
});
