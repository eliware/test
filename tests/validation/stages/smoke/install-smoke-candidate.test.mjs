import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { nextPatchVersion } from "../../../../test-fixtures/helpers/project-version.mjs";
import { packageJson } from "../../../../test-fixtures/helpers/smoke-package.mjs";

const lstat = jest.fn();
const readFile = jest.fn();
const rm = jest.fn();
const createRequire = jest.fn(() => ({ resolve: (specifier) => specifier }));
const moduleApi = await import("node:module");

jest.unstable_mockModule("node:fs/promises", () => ({ lstat, readFile, rm }));
jest.unstable_mockModule("node:module", () => ({ ...moduleApi, createRequire }));

const { installSmokeCandidate } =
  await import("../../../../src/validation/stages/smoke/install-smoke-candidate.mjs");

const targetRoot = "C:/consumer";
const installedPackage = {
  name: packageJson.name,
  version: packageJson.version,
  bin: packageJson.bin,
};
const directory = () => ({ isDirectory: () => true, isSymbolicLink: () => false });

const options = (run, overrides = {}) => ({
  targetRoot,
  packageJson,
  tarball: "candidate.tgz",
  run,
  command: "npm",
  prefix: [],
  env: {},
  resolveModule: (specifier) => specifier,
  ...overrides,
});

beforeEach(() => {
  lstat.mockReset().mockResolvedValue(directory());
  readFile.mockReset().mockResolvedValue(JSON.stringify(installedPackage));
  rm.mockReset().mockResolvedValue(undefined);
  createRequire.mockClear();
});

test("installs the tarball without changing a lockfile and runs consumer npm test", async () => {
  const calls = [];
  await installSmokeCandidate(
    options(async (_command, args, runOptions) => {
      calls.push({ args, options: runOptions });
      return { code: 0 };
    }),
  );

  expect(calls.map(({ args }) => args[0])).toEqual(["install", "test"]);
  expect(calls[0].args).toEqual(expect.arrayContaining(["--package-lock=false", "--no-save"]));
  expect(calls[0].options.cwd).toBe(targetRoot);
  expect(calls[1].options.env.ELIWARE_TEST_SMOKE_CANDIDATE).toBe(packageJson.name);
  expect(rm).toHaveBeenCalledWith(join(targetRoot, "node_modules", "@eliware", "test"), {
    recursive: true,
    force: true,
  });
});

test.each([
  [{ code: 1, stderr: "install failed" }, "Tarball installation failed: install failed"],
  [{ code: 1 }, "Tarball installation failed."],
])("reports tarball installation failures %#", async (installResult, message) => {
  await expect(installSmokeCandidate(options(async () => installResult))).rejects.toThrow(message);
});

test("rejects a mismatched installed version", async () => {
  readFile.mockResolvedValue(JSON.stringify({ ...installedPackage, version: nextPatchVersion }));

  await expect(installSmokeCandidate(options(async () => ({ code: 0 })))).rejects.toThrow(
    `Installed package version ${nextPatchVersion} does not match ${packageJson.version}`,
  );
});

test("rejects a mismatched installed package name", async () => {
  readFile.mockResolvedValue(JSON.stringify({ ...installedPackage, name: "@other/package" }));

  await expect(installSmokeCandidate(options(async () => ({ code: 0 })))).rejects.toThrow(
    "Installed package @other/package does not match @eliware/test",
  );
});

test("rejects a CLI resolution outside the installed smoke package", async () => {
  await expect(
    installSmokeCandidate(
      options(async () => ({ code: 0 }), {
        resolveModule: () => join(targetRoot, "other-package", "bin", "eliware-test.mjs"),
      }),
    ),
  ).rejects.toThrow("Consumer does not resolve the installed smoke package CLI entrypoint");
});

test("uses createRequire for CLI packages and skips resolution without a bin entry", async () => {
  const run = async () => ({ code: 0 });
  await expect(
    installSmokeCandidate(options(run, { resolveModule: undefined })),
  ).resolves.toBeUndefined();
  expect(createRequire).toHaveBeenCalledWith(join(targetRoot, "package.json"));

  createRequire.mockClear();
  await expect(
    installSmokeCandidate(options(run, { packageJson: { ...packageJson, bin: undefined } })),
  ).resolves.toBeUndefined();
  expect(createRequire).not.toHaveBeenCalled();
});

test("reports consumer test failures", async () => {
  await expect(
    installSmokeCandidate(
      options(async (_command, args) =>
        args[0] === "test" ? { code: 1, stdout: "test failed" } : { code: 0 },
      ),
    ),
  ).rejects.toThrow("Consumer npm test failed: test failed");
});
