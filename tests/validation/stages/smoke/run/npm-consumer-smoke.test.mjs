import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { packageVersion } from "../../../../../test-fixtures/helpers/project-version.mjs";

const assertSmokePackageParents = jest.fn();
const captureSmokeTargetState = jest.fn();
const createSmokeTempRoot = jest.fn();
const execute = jest.fn();
const finishSmokeRun = jest.fn();
const lstat = jest.fn();
const mkdir = jest.fn();
const prepareSmokeTargetContext = jest.fn();
const resolvePackExecutable = jest.fn();
const restoreSmokeTargetState = jest.fn();
const runSmokePackageTransaction = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ lstat, mkdir }));
jest.unstable_mockModule(
  "../../../../../src/validation/shared/process/execute-child-process.mjs",
  () => ({ execute }),
);
jest.unstable_mockModule(
  "../../../../../src/validation/stages/pack/resolve-pack-executable.mjs",
  () => ({ resolvePackExecutable }),
);
jest.unstable_mockModule(
  "../../../../../src/validation/stages/smoke/assert-smoke-package-parents.mjs",
  () => ({ assertSmokePackageParents }),
);
jest.unstable_mockModule(
  "../../../../../src/validation/stages/smoke/capture-smoke/target-state.mjs",
  () => ({ captureSmokeTargetState }),
);
jest.unstable_mockModule(
  "../../../../../src/validation/stages/smoke/create-smoke-temp-root.mjs",
  () => ({ createSmokeTempRoot }),
);
jest.unstable_mockModule("../../../../../src/validation/stages/smoke/finish-smoke-run.mjs", () => ({
  finishSmokeRun,
}));
jest.unstable_mockModule(
  "../../../../../src/validation/stages/smoke/prepare-smoke/target-context.mjs",
  () => ({ prepareSmokeTargetContext }),
);
jest.unstable_mockModule(
  "../../../../../src/validation/stages/smoke/restore/smoke-target-state.mjs",
  () => ({ restoreSmokeTargetState }),
);
jest.unstable_mockModule(
  "../../../../../src/validation/stages/smoke/run/smoke-package-transaction.mjs",
  () => ({ runSmokePackageTransaction }),
);

const { runNpmConsumerSmoke } =
  await import("../../../../../src/validation/stages/smoke/run/npm-consumer-smoke.mjs");

const packageJson = { name: "@eliware/test", version: packageVersion };
const targetContext = {
  targetRoot: "consumer-root",
  assertTargetIdentity: jest.fn(),
  binNames: ["eliware-test"],
  childEnv: { PATH: "consumer-path" },
};
const tempState = { path: "temp-root", identity: "temp-identity" };
const smokeState = { storage: "snapshot-root" };

beforeEach(() => {
  jest.resetAllMocks();
  prepareSmokeTargetContext.mockResolvedValue(targetContext);
  createSmokeTempRoot.mockResolvedValue(tempState);
  captureSmokeTargetState.mockResolvedValue(smokeState);
  mkdir.mockResolvedValue(undefined);
  resolvePackExecutable.mockReturnValue(["npm", []]);
  runSmokePackageTransaction.mockResolvedValue("sha256-digest");
  finishSmokeRun.mockImplementation(async ({ outcome }) => outcome);
});

function smoke(options = {}) {
  return runNpmConsumerSmoke({
    root: "source-root",
    target: "consumer-path",
    packageJson,
    ...options,
  });
}

test("prepares, runs, and finishes the package consumer workflow", async () => {
  const write = jest.fn();
  await expect(smoke({ write })).resolves.toBe(
    `Smoke passed: @eliware/test@${packageVersion}. SHA-256 sha256-digest.`,
  );
  expect(prepareSmokeTargetContext).toHaveBeenCalledWith({
    root: "source-root",
    target: "consumer-path",
    packageJson,
    env: process.env,
    inspectTargetRoot: expect.any(Function),
  });
  expect(createSmokeTempRoot).toHaveBeenCalledWith(
    "source-root",
    expect.any(Function),
    undefined,
    undefined,
  );
  expect(assertSmokePackageParents).toHaveBeenCalledWith("consumer-root", packageJson.name);
  expect(captureSmokeTargetState).toHaveBeenCalledWith(
    "consumer-root",
    packageJson.name,
    ["eliware-test"],
    undefined,
    process.platform,
    join("temp-root", "backup"),
  );
  expect(mkdir).toHaveBeenCalledWith(join("temp-root", "backup"));
  expect(mkdir).toHaveBeenCalledWith(join("temp-root", "pack"));
  expect(resolvePackExecutable).toHaveBeenCalledWith(
    targetContext.childEnv,
    process.platform,
    process.execPath,
    "source-root",
  );
  expect(runSmokePackageTransaction).toHaveBeenCalledWith(
    expect.objectContaining({
      root: "source-root",
      packageJson,
      command: "npm",
      prefix: [],
      packDirectory: join("temp-root", "pack"),
      targetRoot: "consumer-root",
      assertTargetIdentity: targetContext.assertTargetIdentity,
      env: { ...targetContext.childEnv, npm_config_cache: join("temp-root", "npm-cache") },
    }),
  );
  expect(write).toHaveBeenCalledWith("Target recovery snapshot: snapshot-root");
  expect(finishSmokeRun).toHaveBeenCalledWith(
    expect.objectContaining({
      outcome: `Smoke passed: @eliware/test@${packageVersion}. SHA-256 sha256-digest.`,
      state: smokeState,
      targetRoot: "consumer-root",
      tempRoot: "temp-root",
      tempIdentity: "temp-identity",
    }),
  );
});

test("returns a consumer context error before it creates a temporary directory", async () => {
  prepareSmokeTargetContext.mockResolvedValue({ error: "consumer metadata failed" });
  await expect(smoke()).resolves.toBe("consumer metadata failed");
  expect(createSmokeTempRoot).not.toHaveBeenCalled();
  expect(finishSmokeRun).not.toHaveBeenCalled();
});

test("returns a temporary directory error before it captures target state", async () => {
  createSmokeTempRoot.mockResolvedValue({ error: "temporary path failed" });
  await expect(smoke()).resolves.toBe("temporary path failed");
  expect(captureSmokeTargetState).not.toHaveBeenCalled();
  expect(finishSmokeRun).not.toHaveBeenCalled();
});

test("reports workflow failures and passes them to finalization", async () => {
  runSmokePackageTransaction.mockRejectedValue(new Error("consumer test failed"));
  await expect(smoke()).resolves.toBe("Tarball consumer smoke failed: consumer test failed");
  expect(finishSmokeRun).toHaveBeenCalledWith(
    expect.objectContaining({
      outcome: "Tarball consumer smoke failed: consumer test failed",
      state: smokeState,
    }),
  );
});
