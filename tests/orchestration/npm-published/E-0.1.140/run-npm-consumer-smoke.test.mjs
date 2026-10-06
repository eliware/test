import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { readFile, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { cleanupSmokeTempRoot as cleanupTempRoot } from "../../../../src/orchestration/npm-published/E-0.1.140/cleanup-smoke-temp-root.mjs";
import {
  createSmokeTarget,
  createFakeSmokeTarget,
  fakeNpm,
  packageJson,
  removeRoots,
  smokeFailureCases,
} from "../../../../test-fixtures/npm-consumers/smoke-test-support.mjs";
const cleanupSmokeTempRoot = jest.fn();
jest.unstable_mockModule(
  "../../../../src/orchestration/npm-published/E-0.1.140/cleanup-smoke-temp-root.mjs",
  () => ({ cleanupSmokeTempRoot }),
);
const { runNpmConsumerSmoke } =
  await import("../../../../src/orchestration/npm-published/E-0.1.140/run-npm-consumer-smoke.mjs");
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
test("packs, installs, tests, and restores the existing consumer package", async () => {
  const { fixture, calls, run, testedManifest } = await createFakeSmokeTarget(roots);
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
test("preserves consumer-created sibling files in package installation ancestor directories", async () => {
  const { fixture, run: fakeRun } = await createFakeSmokeTarget(roots);
  const binSibling = join(fixture.target, "node_modules", ".bin", "consumer-created.txt");
  const scopeSibling = join(fixture.target, "node_modules", "@eliware", "consumer-created.txt");
  const run = async (command, args, options) => {
    const result = await fakeRun(command, args, options);
    if (args.includes("test")) {
      await writeFile(binSibling, "preserve bin sibling");
      await writeFile(scopeSibling, "preserve scope sibling");
    }
    return result;
  };
  await expect(runSmoke(fixture, { run })).resolves.toContain("Smoke passed");
  await expect(readFile(binSibling, "utf8")).resolves.toBe("preserve bin sibling");
  await expect(readFile(scopeSibling, "utf8")).resolves.toBe("preserve scope sibling");
  await expect(
    readFile(join(fixture.target, "node_modules", ".bin", "eliware-test.cmd"), "utf8"),
  ).resolves.toBe("old-bin\n");
});
test("supports packages that have no bin entrypoint", async () => {
  const { fixture, run } = await createFakeSmokeTarget(roots);
  await expect(
    runSmoke(fixture, { packageJson: { ...packageJson, bin: undefined }, run }),
  ).resolves.toContain("Smoke passed");
});
test("uses default npm environment and executable resolution", async () => {
  const { source, target } = await createSmokeTarget(roots);
  const { run } = fakeNpm(target);
  await expect(runNpmConsumerSmoke({ root: source, target, packageJson, run })).resolves.toContain(
    "Smoke passed",
  );
});
test("restores the prior installation when the consumer test fails", async () => {
  const { fixture, run } = await createFakeSmokeTarget(roots, { testCode: 1 });
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
  const alias = join(dirname(fixture.target), "source-alias");
  await symlink(fixture.source, alias, process.platform === "win32" ? "junction" : "dir");
  await expect(runSmoke(fixture, { target: alias, captureState })).resolves.toContain(
    "resolve outside the source checkout",
  );
  expect(captureState).not.toHaveBeenCalled();
});
test("stops if the canonical target directory is replaced after validation", async () => {
  const { fixture, calls, run } = await createFakeSmokeTarget(roots);
  const { lstat } = await import("node:fs/promises");
  const initial = await lstat(fixture.target);
  let inspections = 0;
  const inspectTargetRoot = jest.fn(async () => {
    inspections += 1;
    return inspections === 1
      ? initial
      : {
          dev: initial.dev,
          ino: initial.ino,
          birthtimeMs: initial.birthtimeMs + 1,
          isDirectory: () => true,
        };
  });
  await expect(runSmoke(fixture, { run, inspectTargetRoot })).resolves.toContain(
    "refusing unsafe access",
  );
  expect(inspectTargetRoot).toHaveBeenCalledTimes(2);
  expect(calls).toEqual([]);
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
  const { fixture, run } = await createFakeSmokeTarget(roots);
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
test.each(smokeFailureCases)(
  "reports candidate and installation failures and restores prior package %#",
  async (config, text) => {
    const { fixture, run } = await createFakeSmokeTarget(roots, config);
    await expect(runSmoke(fixture, { run })).resolves.toContain(text);
    await expect(readFile(join(fixture.installed, "package.json"), "utf8")).resolves.toContain(
      '"version":"10.0.0"',
    );
  },
);
test("reports snapshot and restoration failures", async () => {
  const { fixture, run } = await createFakeSmokeTarget(roots);
  await expect(
    runSmoke(fixture, { captureState: async () => Promise.reject(new Error("snapshot denied")) }),
  ).resolves.toContain("snapshot denied");
  const result = await runSmoke(fixture, {
    run,
    captureState: async () => ({ entries: [], storage: "backup-location" }),
    restoreState: async () =>
      Promise.reject(new Error("restore denied; backups at backup-location")),
  });
  expect(result).toContain("Target restoration failed: restore denied");
  expect(result).toContain("backups at backup-location");
  expect(cleanupSmokeTempRoot).toHaveBeenLastCalledWith(
    expect.any(String),
    expect.objectContaining({ isDirectory: expect.any(Function) }),
    { preserve: true },
  );
  await rm(cleanupSmokeTempRoot.mock.calls.at(-1)[0], { recursive: true, force: true });
});
