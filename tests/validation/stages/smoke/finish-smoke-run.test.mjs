import { beforeEach, expect, jest, test } from "@jest/globals";

const lstat = jest.fn();
const rm = jest.fn();
const fileSystem = await import("node:fs/promises");

jest.unstable_mockModule("node:fs/promises", () => ({ ...fileSystem, lstat, rm }));

const { finishSmokeRun } =
  await import("../../../../src/validation/stages/smoke/finish-smoke-run.mjs");

const base = {
  outcome: "Smoke passed.",
  state: { storage: "backup" },
  assertTargetIdentity: async () => {},
  restoreState: async () => {},
  tempRoot: "temporary",
  tempIdentity: {},
};

beforeEach(() => {
  lstat.mockReset().mockResolvedValue({
    dev: 1,
    ino: 2,
    isDirectory: () => true,
    isSymbolicLink: () => false,
  });
  rm.mockReset().mockResolvedValue(undefined);
});

test("restores prior state and appends cleanup diagnostics", async () => {
  const cleanup = jest.fn().mockResolvedValue("Temporary directory left untouched.");
  await expect(finishSmokeRun({ ...base, cleanup })).resolves.toBe(
    "Smoke passed. Previous target package state restored. Temporary directory left untouched.",
  );
  expect(cleanup).toHaveBeenCalledWith("temporary", {}, { preserve: false });
});

test("preserves the backup when identity verification prevents restoration", async () => {
  const cleanup = jest.fn().mockResolvedValue("Backup retained.");
  const result = await finishSmokeRun({
    ...base,
    assertTargetIdentity: async () => {
      throw new Error("target changed");
    },
    cleanup,
  });
  expect(result).toContain("Target restoration failed: target changed");
  expect(cleanup).toHaveBeenCalledWith("temporary", {}, { preserve: true });
});

test("skips restoration for invalid snapshots", async () => {
  const restoreState = jest.fn();
  const cleanup = jest.fn().mockResolvedValue("");
  await expect(
    finishSmokeRun({ ...base, state: { error: "snapshot failed" }, restoreState, cleanup }),
  ).resolves.toBe("Smoke passed.");
  expect(restoreState).not.toHaveBeenCalled();
});

test("reports cleanup rejection as a smoke failure result", async () => {
  await expect(
    finishSmokeRun({
      ...base,
      cleanup: async () => Promise.reject(new Error("cleanup denied")),
    }),
  ).resolves.toContain("Temporary smoke cleanup failed: cleanup denied.");
});

test("appends cleanup diagnostics after a successful restore", async () => {
  const cleanup = jest
    .fn()
    .mockResolvedValue("Temporary directory identity changed; left untouched.");
  await expect(finishSmokeRun({ ...base, cleanup })).resolves.toContain(
    "Smoke passed. Previous target package state restored. Temporary directory identity changed; left untouched.",
  );
});

test("uses the default cleanup for the verified temporary directory", async () => {
  const tempRoot = "C:/temp/smoke";
  const tempIdentity = {
    dev: 1,
    ino: 2,
    isDirectory: () => true,
    isSymbolicLink: () => false,
  };
  const result = await finishSmokeRun({
    ...base,
    state: undefined,
    tempRoot,
    tempIdentity,
  });
  expect(result).toBe("Smoke passed.");
  expect(rm).toHaveBeenCalledWith(tempRoot, { recursive: true, force: true });
});
