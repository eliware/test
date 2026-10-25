import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { packageJson } from "../../../../test-fixtures/helpers/smoke-package.mjs";

const lstat = jest.fn();
const readFile = jest.fn();
const rm = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ lstat, readFile, rm }));

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
});

test("installs the tarball without changing a lockfile and validates the installed package", async () => {
  const calls = [];
  await installSmokeCandidate(
    options(async (_command, args, runOptions) => {
      calls.push({ args, options: runOptions });
      return { code: 0 };
    }),
  );

  expect(calls[0].args[0]).toBe("install");
  expect(calls[0].args).toEqual(expect.arrayContaining(["--package-lock=false", "--no-save"]));
  expect(calls[0].options.cwd).toBe(targetRoot);
  expect(readFile).toHaveBeenCalledWith(
    join(targetRoot, "node_modules", "@eliware", "test", "package.json"),
    "utf8",
  );
  expect(rm).toHaveBeenCalledWith(join(targetRoot, "node_modules", "@eliware", "test"), {
    recursive: true,
    force: true,
  });
});
