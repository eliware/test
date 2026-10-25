import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const lstat = jest.fn();
const realpath = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ lstat, realpath }));
const { resolveSmokeTarget } =
  await import("../../../../src/validation/stages/smoke/resolve-smoke-target.mjs");

const source = join("C:/", "source");
const target = join("C:/", "consumer");
const identity = () => ({ dev: 1, ino: 2, birthtimeMs: 3, isDirectory: () => true });

beforeEach(() => {
  realpath.mockReset().mockImplementation(async (path) => path);
  lstat.mockReset().mockResolvedValue(identity());
});

test("coordinates path resolution and identity protection for a target", async () => {
  const resolved = await resolveSmokeTarget(source, target);

  expect(resolved.targetRoot).toBe(target);
  await expect(resolved.assertIdentity()).resolves.toBeUndefined();
  expect(realpath).toHaveBeenCalledTimes(2);
  expect(lstat).toHaveBeenCalledTimes(2);
});

test("stops before identity inspection when paths overlap", async () => {
  await expect(resolveSmokeTarget(source, join(source, "nested"))).resolves.toMatchObject({
    error: expect.stringContaining("outside the source"),
  });
  expect(lstat).not.toHaveBeenCalled();
});

test("returns identity inspection failures from the coordinator", async () => {
  lstat.mockRejectedValue(new Error("missing"));
  await expect(resolveSmokeTarget(source, target)).resolves.toMatchObject({
    error: expect.stringContaining("existing directory"),
  });
});
