import { expect, jest, test } from "@jest/globals";
import { inspectSmokeTargetIdentity } from "../../../../../src/validation/stages/smoke/resolve-smoke-target/identity.mjs";

const identity = () => ({ dev: 1, ino: 2, birthtimeMs: 3, isDirectory: () => true });

test("requires an existing directory", async () => {
  await expect(
    inspectSmokeTargetIdentity("/consumer", async () => {
      throw new Error("missing");
    }),
  ).resolves.toEqual({ error: "Smoke target must resolve to an existing directory." });
  await expect(
    inspectSmokeTargetIdentity("/consumer", async () => ({ isDirectory: () => false })),
  ).resolves.toEqual({ error: "Smoke target must resolve to an existing directory." });
});

test("accepts an unchanged target identity", async () => {
  const inspect = jest.fn().mockResolvedValue(identity());
  const result = await inspectSmokeTargetIdentity("/consumer", inspect);
  await expect(result.assertIdentity()).resolves.toBeUndefined();
  expect(inspect).toHaveBeenCalledTimes(2);
});

test.each([
  ["device", { dev: 4 }],
  ["inode", { ino: 4 }],
  ["creation time", { birthtimeMs: 4 }],
  ["directory type", { isDirectory: () => false }],
])("rejects a target with a changed %s", async (_field, change) => {
  const inspect = jest
    .fn()
    .mockResolvedValueOnce(identity())
    .mockResolvedValueOnce({
      ...identity(),
      ...change,
    });
  const result = await inspectSmokeTargetIdentity("/consumer", inspect);
  await expect(result.assertIdentity()).rejects.toThrow("untrusted target");
});

test("rejects a target that disappears during validation", async () => {
  const inspect = jest
    .fn()
    .mockResolvedValueOnce(identity())
    .mockRejectedValueOnce(new Error("missing"));
  const result = await inspectSmokeTargetIdentity("/consumer", inspect);
  await expect(result.assertIdentity()).rejects.toThrow("untrusted target");
});
