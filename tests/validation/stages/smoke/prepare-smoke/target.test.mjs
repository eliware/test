import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { packageVersion } from "../../../../../test-fixtures/helpers/project-version.mjs";
const lstat = jest.fn();
const rm = jest.fn();
const fileSystem = await import("node:fs/promises");

jest.unstable_mockModule("node:fs/promises", () => ({ ...fileSystem, lstat, rm }));

const { hasPackageDependency, prepareSmokeTarget } =
  await import("../../../../../src/validation/stages/smoke/prepare-smoke/target.mjs");

const root = "C:/consumer";

beforeEach(() => {
  lstat.mockReset().mockResolvedValue({ isDirectory: () => true, isSymbolicLink: () => false });
  rm.mockReset().mockResolvedValue(undefined);
});

test.each(["dependencies", "devDependencies", "optionalDependencies"])(
  "recognizes the package dependency in %s",
  (field) => {
    expect(
      hasPackageDependency({ [field]: { "@eliware/test": packageVersion } }, "@eliware/test"),
    ).toBe(true);
    expect(hasPackageDependency({}, "@eliware/test")).toBe(false);
  },
);

test("removes the installed package without changing consumer manifests or lockfiles", async () => {
  const installed = join(root, "node_modules", "@eliware", "test");

  await prepareSmokeTarget({ targetRoot: root, packageName: "@eliware/test" });

  expect(rm).toHaveBeenCalledWith(installed, { recursive: true, force: true });
  expect(rm).toHaveBeenCalledTimes(1);
});
