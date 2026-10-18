import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { packageVersion } from "../../../../test-fixtures/helpers/project-version.mjs";

const readFile = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));

const { hasPackageDependency, loadSmokeTarget } =
  await import("../../../../src/validation/stages/smoke/load-smoke-target.mjs");

const target = "C:/consumer";
const packagePath = join(target, "package.json");
const treeLockPath = join(target, "node_modules", ".package-lock.json");
const installedPath = join(target, "node_modules", "@eliware", "test", "package.json");
const validPackage = {
  scripts: { test: "eliware-test" },
  dependencies: { "@eliware/test": "13.0.0" },
};

beforeEach(() => readFile.mockReset());

test.each(["dependencies", "devDependencies", "optionalDependencies"])(
  "recognizes the package dependency in %s",
  (field) => {
    expect(
      hasPackageDependency({ [field]: { "@eliware/test": packageVersion } }, "@eliware/test"),
    ).toBe(true);
    expect(hasPackageDependency({}, "@eliware/test")).toBe(false);
  },
);

function mockTargetFiles(packageJson = validPackage) {
  readFile
    .mockResolvedValueOnce(JSON.stringify(packageJson))
    .mockResolvedValueOnce("installed tree lock")
    .mockResolvedValueOnce('{"name":"@eliware/test","version":"13.0.0"}');
}

test("loads an existing consumer with a test script and package dependency", async () => {
  mockTargetFiles();

  const result = await loadSmokeTarget(target, "@eliware/test");
  expect(result.error).toBeNull();
  expect(result.targetPackage.scripts.test).toBe("eliware-test");
  expect(readFile).toHaveBeenNthCalledWith(1, packagePath, "utf8");
  expect(readFile).toHaveBeenNthCalledWith(2, treeLockPath);
  expect(readFile).toHaveBeenNthCalledWith(3, installedPath);
});

test("rejects the source package as a smoke target", async () => {
  mockTargetFiles({ name: "@eliware/test" });

  await expect(loadSmokeTarget(target, "@eliware/test")).resolves.toEqual({
    error: "Smoke target must not be the source package repository.",
  });
  expect(readFile).toHaveBeenCalledTimes(1);
});

test.each([
  [{ scripts: {} }, "Smoke target must define an npm test script."],
  [
    { scripts: { test: "test" } },
    "Smoke target must list @eliware/test in package.json dependencies.",
  ],
])("rejects a consumer missing required metadata %#", async (packageJson, error) => {
  mockTargetFiles(packageJson);

  await expect(loadSmokeTarget(target, "@eliware/test")).resolves.toHaveProperty("error", error);
});

test("rejects a nonexistent or uninstalled consumer", async () => {
  readFile.mockRejectedValue(new Error("missing"));

  await expect(loadSmokeTarget(target, "@eliware/test")).resolves.toHaveProperty(
    "error",
    "Smoke target must be an existing npm repository with installed dependencies.",
  );
});
