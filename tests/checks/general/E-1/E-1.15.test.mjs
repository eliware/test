import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/general/E-1/E-1.15.mjs";

test("requires latest stable direct dependency versions", async () => {
  await expect(run({ outdatedDependencies: { jest: { current: "1", latest: "2" } } })).resolves.toEqual(expect.objectContaining({ ruleId, status: "fail" }));
  await expect(run({ outdatedDependencies: {} })).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("skips registry lookup when the package has no dependencies", async () => {
  await expect(run({ packageJson: {}, outdatedDependencies: { alpha: { current: "1", latest: "2" } } })).resolves.toEqual({
    ruleId, status: "pass", message: "",
  });
});

test("uses the default read-only registry adapter when no result is injected", async () => {
  await expect(run({ root: "Z:\\eliware-test-missing-root", packageJson: { dependencies: { alpha: "1" } } })).rejects.toBeTruthy();
});
