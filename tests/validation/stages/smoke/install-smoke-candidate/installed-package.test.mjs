import { beforeEach, expect, jest, test } from "@jest/globals";
import { packageJson } from "../../../../../test-fixtures/helpers/smoke-package.mjs";
import { nextPatchVersion } from "../../../../../test-fixtures/helpers/project-version.mjs";

const readFile = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));
const { validateInstalledSmokePackage } =
  await import("../../../../../src/validation/stages/smoke/install-smoke-candidate/installed-package.mjs");

const targetRoot = "C:/consumer";
const installed = { name: packageJson.name, version: packageJson.version, bin: packageJson.bin };
const read = (value) => async () => JSON.stringify(value);

beforeEach(() => readFile.mockReset());

test("accepts the installed package and resolves its CLI entrypoint", async () => {
  await expect(
    validateInstalledSmokePackage({
      targetRoot,
      packageJson,
      read: read(installed),
      resolveModule: (specifier) => specifier,
    }),
  ).resolves.toBeUndefined();
});

test("rejects a different installed package name", async () => {
  await expect(
    validateInstalledSmokePackage({
      targetRoot,
      packageJson,
      read: read({ ...installed, name: "@other/package" }),
      resolveModule: (specifier) => specifier,
    }),
  ).rejects.toThrow("Installed package @other/package does not match @eliware/test.");
});

test("rejects a different installed package version", async () => {
  await expect(
    validateInstalledSmokePackage({
      targetRoot,
      packageJson,
      read: read({ ...installed, version: nextPatchVersion }),
      resolveModule: (specifier) => specifier,
    }),
  ).rejects.toThrow(
    `Installed package version ${nextPatchVersion} does not match ${packageJson.version}.`,
  );
});

test("rejects a CLI resolution outside the installed smoke package", async () => {
  await expect(
    validateInstalledSmokePackage({
      targetRoot,
      packageJson,
      read: read(installed),
      resolveModule: () => "C:/consumer/other-package/bin/eliware-test.mjs",
    }),
  ).rejects.toThrow("Consumer does not resolve the installed smoke package CLI entrypoint.");
});

test("skips CLI resolution when the package has no bin entry", async () => {
  const resolveModule = () => {
    throw new Error("CLI resolution should not run");
  };
  await expect(
    validateInstalledSmokePackage({
      targetRoot,
      packageJson: { ...packageJson, bin: undefined },
      read: read({ name: packageJson.name, version: packageJson.version }),
      resolveModule,
    }),
  ).resolves.toBeUndefined();
});

test("uses the mocked package reader when no reader is supplied", async () => {
  const packageWithoutBin = { ...packageJson, bin: undefined };
  readFile.mockResolvedValue(
    JSON.stringify({ name: packageJson.name, version: packageJson.version }),
  );
  await expect(
    validateInstalledSmokePackage({
      targetRoot,
      packageJson: packageWithoutBin,
      resolveModule: jest.fn(),
    }),
  ).resolves.toBeUndefined();
  expect(readFile).toHaveBeenCalledWith(expect.stringContaining("package.json"), "utf8");
});
