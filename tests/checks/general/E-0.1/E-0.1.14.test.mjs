import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/general/E-0.1/E-0.1.14.mjs";

test("fails for every package reported by npm outdated with latest remediation", async () => {
  await expect(
    run({
      packageJson: { dependencies: { jest: "1" } },
      outdatedDependencies: { jest: { current: "1", latest: "2" } },
    }),
  ).resolves.toEqual({
    ruleId,
    status: "fail",
    message: expect.stringContaining("npm install jest@latest"),
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

test("checks npm outdated even when package metadata declares no dependencies", async () => {
  await expect(
    run({
      packageJson: {},
      outdatedDependencies: { tooling: { current: "1", latest: "2" } },
    }),
  ).resolves.toEqual({
    ruleId,
    status: "fail",
    message: expect.stringContaining("tooling@latest"),
  });
});

test("includes reported development, optional, and peer packages", async () => {
  await expect(
    run({
      packageJson: {
        devDependencies: { tooling: "1" },
        optionalDependencies: { optional: "1" },
        peerDependencies: { peer: "1" },
      },
      outdatedDependencies: {
        tooling: { current: "1", latest: "2" },
        optional: { current: "1", latest: "2" },
        peer: { current: "1", latest: "2" },
      },
    }),
  ).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("tooling@latest, optional@latest, peer@latest"),
  });
});

test("includes all names in the report and recommends @latest for each", async () => {
  const result = await run({
    packageJson: {
      dependencies: { runtime: "1" },
      devDependencies: { tooling: "1" },
    },
    outdatedDependencies: {
      runtime: { current: "1", latest: "2" },
      tooling: { current: "1", latest: "2" },
    },
  });
  expect(result).toMatchObject({ ruleId, status: "fail" });
  expect(result.message).toContain("npm install runtime@latest tooling@latest");
  expect(result.message).toContain("Review package.json and package-lock.json together");
  expect(result.message).toContain("rerun npm ci and npm test");
});

test("only omits the exact packed smoke candidate from outdated findings", async () => {
  await expect(
    run({
      env: { ELIWARE_TEST_SMOKE_CANDIDATE: "@eliware/test" },
      outdatedDependencies: {
        "@eliware/test": { current: "11.0.0", latest: "10.0.0" },
        jest: { current: "1", latest: "2" },
      },
    }),
  ).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("jest@latest"),
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
