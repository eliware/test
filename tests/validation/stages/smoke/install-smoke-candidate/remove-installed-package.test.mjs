import { expect, jest, test } from "@jest/globals";
import { packageJson } from "../../../../../test-fixtures/helpers/smoke-package.mjs";
import removeInstalledPackage from "../../../../../src/validation/stages/smoke/install-smoke-candidate/remove-installed-package.mjs";
test("checks the target around removal and validates package parents", async () => {
  const assertTargetIdentity = jest.fn(async () => {});
  const inspect = jest.fn(async () => ({ isDirectory: () => true, isSymbolicLink: () => false }));
  const remove = jest.fn(async () => {});
  await removeInstalledPackage({
    targetRoot: "C:/consumer",
    packageJson,
    assertTargetIdentity,
    inspect,
    remove,
  });
  expect(assertTargetIdentity).toHaveBeenCalledTimes(4);
  expect(inspect).toHaveBeenCalled();
  expect(remove).toHaveBeenCalledWith(expect.stringContaining("node_modules"), {
    recursive: true,
    force: true,
  });
});
test("stops before removal when target identity changes", async () => {
  const remove = jest.fn();
  await expect(
    removeInstalledPackage({
      targetRoot: "C:/consumer",
      packageJson,
      assertTargetIdentity: async () => {
        throw new Error("target changed");
      },
      inspect: jest.fn(),
      remove,
    }),
  ).rejects.toThrow("target changed");
  expect(remove).not.toHaveBeenCalled();
});
test("uses the default target identity check", async () => {
  await expect(
    removeInstalledPackage({
      targetRoot: "C:/consumer",
      packageJson,
      assertTargetIdentity: undefined,
      inspect: async () => ({ isDirectory: () => true, isSymbolicLink: () => false }),
      remove: async () => {},
    }),
  ).resolves.toBeUndefined();
});
