import { expect, jest, test } from "@jest/globals";
import { lstat, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanupSmokeTempRoot } from "../../../../src/orchestration/npm-published/E-0.1.140/cleanup-smoke-temp-root.mjs";

const identity = { dev: 1, ino: 2, isDirectory: () => true, isSymbolicLink: () => false };

test("removes only the original temporary directory", async () => {
  const remove = jest.fn();
  await expect(
    cleanupSmokeTempRoot("C:/temp/smoke", identity, { inspect: async () => identity, remove }),
  ).resolves.toBe("");
  expect(remove).toHaveBeenCalledWith("C:/temp/smoke", { recursive: true, force: true });
});

test("uses filesystem defaults when no cleanup adapters are supplied", async () => {
  const path = await mkdtemp(join(tmpdir(), "eliware-smoke-cleanup-test-"));
  const original = await lstat(path);
  await expect(cleanupSmokeTempRoot(path, original)).resolves.toBe("");
  await expect(lstat(path)).rejects.toMatchObject({ code: "ENOENT" });
});

test.each([
  [{ ...identity, dev: 3 }, "identity changed"],
  [{ ...identity, ino: 3 }, "identity changed"],
  [{ ...identity, isDirectory: () => false }, "identity changed"],
  [{ ...identity, isSymbolicLink: () => true }, "identity changed"],
])("leaves a replacement path untouched %#", async (replacement, message) => {
  const remove = jest.fn();
  await expect(
    cleanupSmokeTempRoot("C:/temp/smoke", identity, {
      inspect: async () => replacement,
      remove,
    }),
  ).resolves.toContain(message);
  expect(remove).not.toHaveBeenCalled();
});

test("preserves the temporary root when target restoration failed", async () => {
  const inspect = jest.fn();
  const remove = jest.fn();
  await expect(
    cleanupSmokeTempRoot("C:/temp/smoke", identity, { preserve: true, inspect, remove }),
  ).resolves.toBe("Recovery data retained at C:/temp/smoke.");
  expect(inspect).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
});

test("reports cleanup failures and retains the recovery location", async () => {
  await expect(
    cleanupSmokeTempRoot("C:/temp/smoke", identity, {
      inspect: async () => identity,
      remove: async () => {
        throw new Error("access denied");
      },
    }),
  ).resolves.toContain("Recovery data retained at C:/temp/smoke.");
});

test("treats an already-removed temporary root as clean", async () => {
  const missing = Object.assign(new Error("missing"), { code: "ENOENT" });
  await expect(
    cleanupSmokeTempRoot("C:/temp/smoke", identity, {
      inspect: async () => {
        throw missing;
      },
    }),
  ).resolves.toBe("");
});
