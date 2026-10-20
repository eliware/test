import { beforeEach, expect, jest, test } from "@jest/globals";
import { packageJson } from "../../../../../test-fixtures/helpers/smoke-package.mjs";

const lstat = jest.fn();
const rm = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ lstat, rm }));
const { installSmokePackage } =
  await import("../../../../../src/validation/stages/smoke/install-smoke-candidate/package-install.mjs");

const targetRoot = "C:/consumer";
const directory = () => ({ isDirectory: () => true, isSymbolicLink: () => false });

beforeEach(() => {
  lstat.mockReset();
  rm.mockReset();
});

function options(overrides = {}) {
  return {
    targetRoot,
    packageJson,
    tarball: "candidate.tgz",
    run: jest.fn(async () => ({ code: 0 })),
    command: "npm",
    prefix: [],
    env: {},
    inspect: jest.fn(async () => directory()),
    remove: jest.fn(async () => {}),
    ...overrides,
  };
}

test("removes the installed package before installing the tarball", async () => {
  const input = options();
  await installSmokePackage(input);

  expect(input.remove).toHaveBeenCalledWith(expect.stringContaining("node_modules"), {
    recursive: true,
    force: true,
  });
  expect(input.run).toHaveBeenCalledWith(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-save",
      "--package-lock=false",
      "--no-audit",
      "--no-fund",
      "candidate.tgz",
    ],
    { cwd: targetRoot, env: {} },
  );
  expect(input.inspect).toHaveBeenCalled();
});

test("rejects a changed target before running npm install", async () => {
  const input = options();
  input.assertTargetIdentity = jest.fn(async () => {
    throw new Error("target changed");
  });

  await expect(installSmokePackage(input)).rejects.toThrow("target changed");
  expect(input.run).not.toHaveBeenCalled();
  expect(input.remove).not.toHaveBeenCalled();
});

test.each([
  [{ code: 1, stderr: "install failed" }, "Tarball installation failed: install failed"],
  [{ code: 1 }, "Tarball installation failed."],
])("reports install failures with available output %#", async (result, message) => {
  await expect(installSmokePackage(options({ run: async () => result }))).rejects.toThrow(message);
});

test("uses mocked filesystem defaults when dependencies are omitted", async () => {
  lstat.mockResolvedValue(directory());
  rm.mockResolvedValue(undefined);
  const input = options();
  delete input.inspect;
  delete input.remove;

  await installSmokePackage(input);

  expect(lstat).toHaveBeenCalled();
  expect(rm).toHaveBeenCalled();
});
