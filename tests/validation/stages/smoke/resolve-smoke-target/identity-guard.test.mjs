import { expect, jest, test } from "@jest/globals";
import { createSmokeTargetIdentityGuard } from "../../../../../src/validation/stages/smoke/resolve-smoke-target/identity-guard.mjs";

const identity = () => ({ dev: 1, ino: 2, birthtimeMs: 3, isDirectory: () => true });

test("accepts an unchanged target identity", async () => {
  const inspect = jest.fn().mockResolvedValue(identity());
  await expect(createSmokeTargetIdentityGuard("/consumer", identity(), inspect)()).resolves.toBe(
    undefined,
  );
  expect(inspect).toHaveBeenCalledTimes(1);
});

test.each([
  ["device", { dev: 4 }],
  ["inode", { ino: 4 }],
  ["creation time", { birthtimeMs: 4 }],
  ["directory type", { isDirectory: () => false }],
])("rejects a target with a changed %s", async (_field, change) => {
  const inspect = jest.fn().mockResolvedValue({ ...identity(), ...change });
  await expect(createSmokeTargetIdentityGuard("/consumer", identity(), inspect)()).rejects.toThrow(
    "untrusted target",
  );
});

test("rejects a target that disappears during validation", async () => {
  const inspect = jest.fn().mockRejectedValue(new Error("missing"));
  await expect(createSmokeTargetIdentityGuard("/consumer", identity(), inspect)()).rejects.toThrow(
    "untrusted target",
  );
});
