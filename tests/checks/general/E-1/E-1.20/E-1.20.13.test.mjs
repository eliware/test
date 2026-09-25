import { expect, jest, test } from "@jest/globals";
import { ruleId, run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.13.mjs";
import { ruleId as otherRuleId, run as runDirectVersionCheck } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.12.mjs";
import { ruleId as generalRuleId, run as runGeneralOutdatedCheck } from "../../../../../src/checks/general/E-1/E-1.14.mjs";
import { ruleId as stableRuleId, run as runGeneralStableCheck } from "../../../../../src/checks/general/E-1/E-1.15.mjs";

test("requires latest stable dependency versions before release", async () => {
  await expect(run({ outdatedDependencies: { jest: { current: "1", latest: "2" } } })).resolves.toEqual(expect.objectContaining({ ruleId, status: "fail" }));
  await expect(run({ outdatedDependencies: {} })).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("uses the read-only registry adapter when no result is injected", async () => {
  await expect(run({ root: "fixture", readOutdated: async () => ({}) })).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("uses the default read-only registry adapter when no result is injected", async () => {
  await expect(run({ root: "Z:\\eliware-test-missing-root" })).rejects.toBeTruthy();
});

test("shares one outdated lookup across all dependency version checks", async () => {
  const readOutdated = jest.fn().mockResolvedValue({});
  const context = { root: "fixture", packageJson: { dependencies: { alpha: "1" } }, readOutdated };
  await expect(Promise.all([
    run(context),
    runDirectVersionCheck(context),
    runGeneralOutdatedCheck(context),
    runGeneralStableCheck(context),
  ])).resolves.toEqual([
    { ruleId, status: "pass", message: "" },
    { ruleId: otherRuleId, status: "pass", message: "" },
    { ruleId: generalRuleId, status: "pass", message: "" },
    { ruleId: stableRuleId, status: "pass", message: "" },
  ]);
  expect(readOutdated).toHaveBeenCalledTimes(1);
});
