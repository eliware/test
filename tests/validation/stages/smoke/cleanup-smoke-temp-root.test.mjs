import { beforeEach, expect, jest, test } from "@jest/globals";

const lstat = jest.fn();
const rm = jest.fn();
const fileSystem = await import("node:fs/promises");

jest.unstable_mockModule("node:fs/promises", () => ({ ...fileSystem, lstat, rm }));

const { cleanupSmokeTempRoot } =
  await import("../../../../src/validation/stages/smoke/cleanup-smoke-temp-root.mjs");

const path = "C:/temp/smoke";
const identity = { dev: 1, ino: 2, isDirectory: () => true, isSymbolicLink: () => false };

beforeEach(() => {
  lstat.mockReset().mockResolvedValue(identity);
  rm.mockReset().mockResolvedValue(undefined);
});

test("removes only the original temporary directory", async () => {
  await expect(cleanupSmokeTempRoot(path, identity)).resolves.toBe("");
  expect(rm).toHaveBeenCalledWith(path, { recursive: true, force: true });
});

test.each([
  [{ ...identity, dev: 3 }, "identity changed"],
  [{ ...identity, ino: 3 }, "identity changed"],
  [{ ...identity, isDirectory: () => false }, "identity changed"],
  [{ ...identity, isSymbolicLink: () => true }, "identity changed"],
])("leaves a replacement path untouched %#", async (replacement, message) => {
  lstat.mockResolvedValue(replacement);

  await expect(cleanupSmokeTempRoot(path, identity)).resolves.toContain(message);
  expect(rm).not.toHaveBeenCalled();
});

test("preserves the temporary root when target restoration failed", async () => {
  await expect(cleanupSmokeTempRoot(path, identity, { preserve: true })).resolves.toBe(
    "Recovery data retained at C:/temp/smoke.",
  );
  expect(lstat).not.toHaveBeenCalled();
  expect(rm).not.toHaveBeenCalled();
});

test("reports cleanup failures and retains the recovery location", async () => {
  rm.mockRejectedValue(new Error("access denied"));

  await expect(cleanupSmokeTempRoot(path, identity)).resolves.toContain(
    "Recovery data retained at C:/temp/smoke.",
  );
});

test("treats an already-removed temporary root as clean", async () => {
  lstat.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));

  await expect(cleanupSmokeTempRoot(path, identity)).resolves.toBe("");
});
