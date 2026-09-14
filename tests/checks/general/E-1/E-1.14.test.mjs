import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/general/E-1/E-1.14.mjs";

test("fails when direct dependencies are outdated", async () => {
  await expect(run({ outdatedDependencies: { jest: { current: "1", latest: "2" } } })).resolves.toEqual({
    ruleId, status: "fail", message: expect.stringContaining("jest (1 -> 2)"),
  });
  await expect(run({ outdatedDependencies: {} })).resolves.toEqual({ ruleId, status: "pass", message: "" });
  await expect(run({ readOutdated: async () => ({}) })).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("skips registry lookup when the package has no dependencies", async () => {
  await expect(run({ packageJson: {}, readOutdated: async () => { throw new Error("registry must not be queried"); } })).resolves.toEqual({
    ruleId, status: "pass", message: "",
  });
});

test("reads the registry when dependencies exist and no injected result is supplied", async () => {
  await expect(run({ packageJson: { dependencies: { alpha: "1" } }, readOutdated: async () => ({}) })).resolves.toEqual({
    ruleId, status: "pass", message: "",
  });
});

test("uses the default read-only registry adapter when no adapter is supplied", async () => {
  await expect(run({ root: "Z:\\eliware-test-missing-root", packageJson: { dependencies: { alpha: "1" } } })).rejects.toBeTruthy();
});

test("defaults the lookup root to the current repository", async () => {
  await expect(run({ packageJson: { dependencies: { alpha: "1" } }, readOutdated: async () => ({}) })).resolves.toEqual({ ruleId, status: "pass", message: "" });
});
