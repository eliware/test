import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const lstat = jest.fn();
const realpath = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ lstat, realpath }));

const { resolveSmokeTarget } =
  await import("../../../../src/validation/stages/smoke/resolve-smoke-target.mjs");

const source = join("C:/", "source");
const target = join("C:/", "consumer");
const identity = () => ({ dev: 1, ino: 2, birthtimeMs: 3, mtimeMs: 4, isDirectory: () => true });

beforeEach(() => {
  realpath.mockReset().mockImplementation(async (path) => path);
  lstat.mockReset().mockResolvedValue(identity());
});

test("resolves an external target and verifies its stable directory identity", async () => {
  const resolved = await resolveSmokeTarget(source, target);
  expect(resolved.error).toBeUndefined();
  expect(resolved.targetRoot).toBe(target);
  await expect(resolved.assertIdentity()).resolves.toBeUndefined();
  expect(lstat).toHaveBeenCalledTimes(2);
});

test("rejects unresolved and source-contained targets", async () => {
  realpath.mockImplementation(async (path) => {
    if (path.endsWith("missing")) throw new Error("missing");
    return path;
  });
  await expect(resolveSmokeTarget(source, `${target}-missing`)).resolves.toMatchObject({
    error: expect.stringContaining("both resolve"),
  });
  await expect(resolveSmokeTarget(source, source)).resolves.toMatchObject({
    error: expect.stringContaining("outside the source"),
  });
  await expect(resolveSmokeTarget(source, join(source, "nested"))).resolves.toMatchObject({
    error: expect.stringContaining("outside the source"),
  });
  await expect(resolveSmokeTarget(join(source, "nested"), source)).resolves.toMatchObject({
    error: expect.stringContaining("outside the source"),
  });
});

test.each([
  [
    "inspection errors",
    async () => {
      throw new Error("missing");
    },
  ],
  ["non-directory targets", async () => ({ isDirectory: () => false })],
])("rejects %s before returning a target", async (_label, inspect) => {
  lstat.mockImplementation(inspect);
  await expect(resolveSmokeTarget(source, target)).resolves.toMatchObject({
    error: expect.stringContaining("existing directory"),
  });
});

test.each([
  ["replacement", async () => ({ ...identity(), birthtimeMs: 4 })],
  [
    "disappearance",
    async () => {
      throw new Error("gone");
    },
  ],
])("rejects target %s during identity verification", async (_label, changed) => {
  lstat.mockResolvedValueOnce(identity()).mockImplementationOnce(changed);
  const resolved = await resolveSmokeTarget(source, target);
  await expect(resolved.assertIdentity()).rejects.toThrow("Refusing access to an untrusted target");
});

test("allows target contents to change without replacing the target directory", async () => {
  lstat.mockResolvedValueOnce(identity()).mockResolvedValueOnce({ ...identity(), mtimeMs: 5 });
  const resolved = await resolveSmokeTarget(source, target);
  await expect(resolved.assertIdentity()).resolves.toBeUndefined();
});
