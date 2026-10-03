import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cleanupSmokeTempRoot as cleanupTempRoot } from "../../../../src/checks/npm-published/E-0.1.140/cleanup-smoke-temp-root.mjs";
import {
  createSmokeTarget,
  fakeNpm,
  packageJson,
  removeRoots,
} from "../../../../test-fixtures/npm-consumers/smoke-test-support.mjs";

const cleanupSmokeTempRoot = jest.fn();
jest.unstable_mockModule(
  "../../../../src/checks/npm-published/E-0.1.140/cleanup-smoke-temp-root.mjs",
  () => ({ cleanupSmokeTempRoot }),
);
const { runNpmConsumerSmoke } =
  await import("../../../../src/checks/npm-published/E-0.1.140/run-npm-consumer-smoke.mjs");

let roots = [];

beforeEach(() => cleanupSmokeTempRoot.mockImplementation((...args) => cleanupTempRoot(...args)));

afterEach(async () => {
  await removeRoots(roots);
  roots = [];
});

function runSmoke(fixture, options = {}) {
  return runNpmConsumerSmoke({
    root: fixture.source,
    target: fixture.target,
    packageJson,
    resolveCommand: () => ["npm", []],
    env: {},
    ...options,
  });
}

const packReport = (entry = {}) => ({
  packStdout: JSON.stringify([
    { name: "@eliware/test", version: "11.0.0", filename: "x.tgz", files: [], ...entry },
  ]),
});

test("packs, installs, tests, and restores the existing consumer package", async () => {
  const fixture = await createSmokeTarget(roots);
  const { calls, run, testedManifest } = fakeNpm(fixture.target);
  const result = await runSmoke(fixture, { run });
  expect(result).toContain("@eliware/test@11.0.0");
  expect(result).toContain("SHA-256");
  expect(result).toContain("Previous target package state restored");
  expect(
    calls.map(({ args }) => args.find((arg) => ["pack", "install", "test"].includes(arg))),
  ).toEqual(["pack", "install", "test"]);
  expect(calls[0].args).toContain("--ignore-scripts");
  expect(calls[1].args).toContain("--no-save");
  expect(calls[1].args).toContain("--package-lock=false");
  expect(testedManifest.dependency).toBe("10.0.0");
  expect(testedManifest.lock).toBe("old-lock\n");
  expect(testedManifest.candidate).toBe(packageJson.name);
  await expect(readFile(join(fixture.target, "package.json"), "utf8")).resolves.toContain(
    '"@eliware/test":"10.0.0"',
  );
  await expect(readFile(join(fixture.installed, "package.json"), "utf8")).resolves.toContain(
    '"version":"10.0.0"',
  );
});

test("supports packages that have no bin entrypoint", async () => {
  const fixture = await createSmokeTarget(roots);
  const { run } = fakeNpm(fixture.target);
  await expect(
    runSmoke(fixture, { packageJson: { ...packageJson, bin: undefined }, run }),
  ).resolves.toContain("Smoke passed");
});

test("uses default npm environment and executable resolution", async () => {
  const fixture = await createSmokeTarget(roots);
  const { run } = fakeNpm(fixture.target);
  await expect(
    runNpmConsumerSmoke({
      root: fixture.source,
      target: fixture.target,
      packageJson,
      run,
    }),
  ).resolves.toContain("Smoke passed");
});

test("restores the prior installation when the consumer test fails", async () => {
  const fixture = await createSmokeTarget(roots);
  const { run } = fakeNpm(fixture.target, { testCode: 1 });
  await expect(runSmoke(fixture, { run })).resolves.toContain("Consumer npm test failed");
  await expect(readFile(join(fixture.installed, "package.json"), "utf8")).resolves.toContain(
    '"version":"10.0.0"',
  );
});

test("validates the smoke request before capturing consumer state", async () => {
  const fixture = await createSmokeTarget(roots);
  const captureState = jest.fn();
  await expect(
    runSmoke(fixture, {
      packageJson: { ...packageJson, publishConfig: {} },
      captureState,
    }),
  ).resolves.toContain("provenance");
  expect(captureState).not.toHaveBeenCalled();
});

test("leaves an unverified temporary path untouched", async () => {
  const fixture = await createSmokeTarget(roots);
  const result = await runSmoke(fixture, {
    inspectTempRoot: async () => {
      throw new Error("identity unavailable");
    },
  });
  expect(result).toContain("Cannot verify temporary smoke directory; left untouched");
  const path = result.match(/left untouched at (.+): identity unavailable/u)?.[1];
  expect(path).toBeTruthy();
  await rm(path, { recursive: true, force: true });
});

test("reports temporary cleanup diagnostics after a successful restore", async () => {
  const fixture = await createSmokeTarget(roots);
  const { run } = fakeNpm(fixture.target);
  cleanupSmokeTempRoot.mockResolvedValueOnce(
    "Temporary smoke directory identity changed; left untouched.",
  );
  const result = await runSmoke(fixture, { run });
  expect(result).toContain("Previous target package state restored");
  expect(result).toContain("Temporary smoke directory identity changed");
  await rm(cleanupSmokeTempRoot.mock.calls.at(-1)[0], { recursive: true, force: true });
});

test("requires the target test script and an eliware-test dependency", async () => {
  const fixture = await createSmokeTarget(roots);
  await writeFile(
    join(fixture.target, "package.json"),
    JSON.stringify({ devDependencies: { "@eliware/test": "10" } }),
  );
  await expect(runSmoke(fixture)).resolves.toContain("npm test script");
  await writeFile(
    join(fixture.target, "package.json"),
    JSON.stringify({ scripts: { test: "echo test" } }),
  );
  await expect(runSmoke(fixture)).resolves.toContain("must declare @eliware/test");
});

test.each([
  [{ packCode: 1, packStderr: "pack output" }, "pack output"],
  [{ packCode: 1, noPackStdout: true }, "npm pack failed."],
  [{ noPackStdout: true }, "safe tarball filename"],
  [{ packStdout: "not-json" }, "safe tarball filename"],
  [packReport({ name: undefined, version: "10.0.0" }), "safe tarball filename"],
  [packReport({ version: "10.0.0" }), "version does not match"],
  [packReport({ filename: "../x.tgz" }), "safe tarball filename"],
  [packReport(), "omitted"],
  [{ installCode: 1, installStdout: "install output" }, "Tarball installation failed"],
  [{ installVersion: "10.0.0" }, "Installed package version 10.0.0 does not match 11.0.0"],
])(
  "reports candidate and installation failures and restores prior package %#",
  async (config, text) => {
    const fixture = await createSmokeTarget(roots);
    const { run } = fakeNpm(fixture.target, config);
    await expect(runSmoke(fixture, { run })).resolves.toContain(text);
    await expect(readFile(join(fixture.installed, "package.json"), "utf8")).resolves.toContain(
      '"version":"10.0.0"',
    );
  },
);

test("reports snapshot and restoration failures", async () => {
  const fixture = await createSmokeTarget(roots);
  await expect(
    runSmoke(fixture, { captureState: async () => Promise.reject(new Error("snapshot denied")) }),
  ).resolves.toContain("snapshot denied");
  const { run } = fakeNpm(fixture.target);
  await expect(
    runSmoke(fixture, {
      run,
      captureState: async () => ({ entries: [], storage: "backup-location" }),
      restoreState: async () => Promise.reject(new Error("restore denied")),
    }),
  ).resolves.toContain("Target restoration failed: restore denied");
  expect(cleanupSmokeTempRoot).toHaveBeenLastCalledWith(
    expect.any(String),
    expect.objectContaining({ isDirectory: expect.any(Function) }),
    { preserve: true },
  );
  await rm(cleanupSmokeTempRoot.mock.calls.at(-1)[0], { recursive: true, force: true });
});
