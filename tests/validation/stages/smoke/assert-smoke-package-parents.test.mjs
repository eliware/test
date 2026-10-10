import { expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { assertSmokePackageParents } from "../../../../src/validation/stages/smoke/assert-smoke-package-parents.mjs";

test("checks node_modules and package scope parents", async () => {
  const inspect = jest.fn(async () => ({ isSymbolicLink: () => false, isDirectory: () => true }));
  await assertSmokePackageParents("consumer", "@eliware/test", inspect);
  expect(inspect.mock.calls.map(([path]) => path)).toEqual([
    join("consumer", "node_modules"),
    join("consumer", "node_modules", ".bin"),
    join("consumer", "node_modules", "@eliware"),
  ]);
});

test("rejects a linked package parent", async () => {
  const inspect = jest.fn(async () => ({ isSymbolicLink: () => true, isDirectory: () => false }));
  await expect(assertSmokePackageParents("consumer", "@eliware/test", inspect)).rejects.toThrow(
    "Cannot safely use a smoke package path through a link",
  );
});

test("stops when a package parent does not exist", async () => {
  const inspect = jest.fn(async () => {
    throw Object.assign(new Error("missing"), { code: "ENOENT" });
  });
  await expect(
    assertSmokePackageParents("consumer", "@eliware/test", inspect),
  ).resolves.toBeUndefined();
  expect(inspect).toHaveBeenCalledTimes(3);
});

test("reports inspection failures other than missing parents", async () => {
  const failure = new Error("access denied");
  await expect(
    assertSmokePackageParents("consumer", "@eliware/test", async () => {
      throw failure;
    }),
  ).rejects.toBe(failure);
});

test("rejects a package parent that is not a directory", async () => {
  await expect(
    assertSmokePackageParents("consumer", "@eliware/test", async () => ({
      isSymbolicLink: () => false,
      isDirectory: () => false,
    })),
  ).rejects.toThrow("Cannot safely use a smoke package path through a non-directory");
});
