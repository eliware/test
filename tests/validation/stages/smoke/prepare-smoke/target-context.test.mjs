import { beforeEach, expect, jest, test } from "@jest/globals";
import { resolve } from "node:path";
import { packageJson } from "../../../../../test-fixtures/helpers/smoke-package.mjs";

const lstat = jest.fn();
const realpath = jest.fn();
const readFile = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ lstat, realpath, readFile }));

const { prepareSmokeTargetContext } =
  await import("../../../../../src/validation/stages/smoke/prepare-smoke/target-context.mjs");

const root = resolve("/source");
const target = resolve("/consumer");
const targetPackage = {
  scripts: { test: "eliware-test" },
  dependencies: { "@eliware/test": "14.0.0" },
};
const identity = () => ({ dev: 1, ino: 2, birthtimeMs: 3, isDirectory: () => true });

function setConsumerFiles() {
  realpath.mockImplementation(async (path) => path);
  lstat.mockResolvedValue(identity());
  readFile
    .mockResolvedValueOnce(JSON.stringify(targetPackage))
    .mockResolvedValueOnce("installed tree lock")
    .mockResolvedValueOnce('{"name":"@eliware/test","version":"14.0.0"}');
}

beforeEach(() => {
  lstat.mockReset();
  realpath.mockReset();
  readFile.mockReset();
});

test("returns the resolved consumer, identity guard, executable names, and copied environment", async () => {
  setConsumerFiles();
  const env = { PATH: "consumer-path" };
  const context = await prepareSmokeTargetContext({ root, target, packageJson, env });

  expect(context).toMatchObject({ targetRoot: target, binNames: ["eliware-test"], childEnv: env });
  expect(context.childEnv).not.toBe(env);
  await expect(context.assertTargetIdentity()).resolves.toBeUndefined();
});

test("returns request errors before it inspects the target", async () => {
  const result = await prepareSmokeTargetContext({ root, target: "", packageJson });

  expect(result.error).toContain("Supply one existing consumer");
  expect(lstat).not.toHaveBeenCalled();
});

test("returns target resolution errors", async () => {
  realpath.mockImplementation(async (path) => {
    if (path === target) throw new Error("missing target");
    return path;
  });

  await expect(prepareSmokeTargetContext({ root, target, packageJson })).resolves.toMatchObject({
    error: expect.stringContaining("both resolve"),
  });
});

test("returns consumer metadata errors", async () => {
  realpath.mockImplementation(async (path) => path);
  lstat.mockResolvedValue(identity());
  readFile.mockRejectedValue(new Error("missing package"));

  await expect(prepareSmokeTargetContext({ root, target, packageJson })).resolves.toMatchObject({
    error: expect.stringContaining("existing npm repository"),
  });
});

test("returns no executable names when the package has no bin entry", async () => {
  setConsumerFiles();
  const context = await prepareSmokeTargetContext({
    root,
    target,
    packageJson: { ...packageJson, bin: undefined },
  });

  expect(context.binNames).toEqual([]);
});
