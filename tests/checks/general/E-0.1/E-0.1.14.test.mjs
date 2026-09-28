import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/general/E-0.1/E-0.1.14.mjs";

test("fails when direct dependencies are outdated", async () => {
  await expect(
    run({
      packageJson: { dependencies: { jest: "1" } },
      outdatedDependencies: { jest: { current: "1", latest: "2" } },
    }),
  ).resolves.toEqual({
    ruleId,
    status: "fail",
    message: expect.stringContaining("jest (1 -> 2)"),
  });
  await expect(run({ outdatedDependencies: {} })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
  await expect(run({ readOutdated: async () => ({}) })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("skips registry lookup when the package has no dependencies", async () => {
  await expect(
    run({
      packageJson: {},
      readOutdated: async () => {
        throw new Error("registry must not be queried");
      },
    }),
  ).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("does not treat development, optional, or peer packages as release dependencies", async () => {
  await expect(
    run({
      packageJson: {
        devDependencies: { tooling: "1" },
        optionalDependencies: { optional: "1" },
        peerDependencies: { peer: "1" },
      },
      readOutdated: async () => {
        throw new Error("registry must not be queried");
      },
    }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("reports only outdated dependencies declared in the runtime dependency section", async () => {
  await expect(
    run({
      packageJson: {
        dependencies: { runtime: "1" },
        devDependencies: { tooling: "1" },
      },
      outdatedDependencies: {
        runtime: { current: "1", latest: "2" },
        tooling: { current: "1", latest: "2" },
      },
    }),
  ).resolves.toEqual({
    ruleId,
    status: "fail",
    message: expect.stringContaining("runtime (1 -> 2)"),
  });
});

test("reads the registry when dependencies exist and no injected result is supplied", async () => {
  await expect(
    run({ packageJson: { dependencies: { alpha: "1" } }, readOutdated: async () => ({}) }),
  ).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("returns a stable failure result when the read-only registry adapter fails", async () => {
  await expect(
    run({
      packageJson: { dependencies: { alpha: "1" } },
      env: { NPM_TOKEN: "private-token" },
      readOutdated: async () => {
        throw new Error("NPM_TOKEN=private-token registry unavailable");
      },
    }),
  ).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("NPM_TOKEN=[REDACTED]"),
  });
  await expect(
    run({
      packageJson: { dependencies: { alpha: "1" } },
      readOutdated: async () => {
        throw new Error("");
      },
    }),
  ).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("unknown registry lookup error"),
  });
});

test("defaults the lookup root to the current repository", async () => {
  await expect(
    run({ packageJson: { dependencies: { alpha: "1" } }, readOutdated: async () => ({}) }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});
