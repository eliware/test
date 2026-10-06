import { lstat, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { finishSmokeRun } from "../../../../src/orchestration/npm-published/E-0.1.140/finish-smoke-run.mjs";

const base = {
  outcome: "Smoke passed.",
  state: { storage: "backup" },
  assertTargetIdentity: async () => {},
  restoreState: async () => {},
  tempRoot: "temporary",
  tempIdentity: {},
};

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

test("uses the default cleanup for the verified temporary directory", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "eliware-smoke-finish-"));
  const result = await finishSmokeRun({
    ...base,
    state: undefined,
    tempRoot,
    tempIdentity: await lstat(tempRoot),
  });
  expect(result).toBe("Smoke passed.");
  await expect(lstat(tempRoot)).rejects.toThrow();
});
