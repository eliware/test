import { lstat } from "node:fs/promises";
import { expect, jest, test } from "@jest/globals";
import {
  createSmokeTarget,
  removeRoots,
} from "../../../../test-fixtures/npm-consumers/smoke-test-support.mjs";
import { resolveSmokeTarget } from "../../../../src/checks/npm-published/E-0.1.140/resolve-smoke-target.mjs";

const roots = [];

test("resolves an external target and verifies its stable directory identity", async () => {
  const fixture = await createSmokeTarget(roots);
  const target = await resolveSmokeTarget(fixture.source, fixture.target);
  expect(target.error).toBeUndefined();
  await expect(target.assertIdentity()).resolves.toBeUndefined();
  await removeRoots(roots);
});

test("rejects unresolved and source-contained targets", async () => {
  const fixture = await createSmokeTarget(roots);
  await expect(
    resolveSmokeTarget(fixture.source, `${fixture.target}-missing`),
  ).resolves.toMatchObject({ error: expect.stringContaining("both resolve") });
  await expect(resolveSmokeTarget(fixture.root, fixture.target)).resolves.toMatchObject({
    error: expect.stringContaining("outside the source"),
  });
  await removeRoots(roots);
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
  const fixture = await createSmokeTarget(roots);
  await expect(resolveSmokeTarget(fixture.source, fixture.target, inspect)).resolves.toMatchObject({
    error: expect.stringContaining("existing directory"),
  });
  await removeRoots(roots);
});

test.each([
  [
    "replacement",
    async (initial) => ({
      dev: initial.dev,
      ino: initial.ino,
      birthtimeMs: initial.birthtimeMs + 1,
      isDirectory: () => true,
    }),
  ],
  [
    "disappearance",
    async () => {
      throw new Error("gone");
    },
  ],
])("rejects target %s during identity verification", async (_label, changed) => {
  const fixture = await createSmokeTarget(roots);
  const initial = await lstat(fixture.target);
  const inspect = jest
    .fn()
    .mockResolvedValueOnce(initial)
    .mockImplementation(() => changed(initial));
  const target = await resolveSmokeTarget(fixture.source, fixture.target, inspect);
  await expect(target.assertIdentity()).rejects.toThrow("refusing unsafe access");
  await removeRoots(roots);
});
