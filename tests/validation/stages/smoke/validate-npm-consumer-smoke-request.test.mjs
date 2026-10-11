import { afterEach, expect, jest, test } from "@jest/globals";
import { symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import {
  createSmokeTarget,
  packageJson,
  removeRoots,
} from "../../../../test-fixtures/npm-consumers/smoke-test-support.mjs";
import { runNpmConsumerSmoke } from "../../../../src/validation/stages/smoke/run-npm-consumer-smoke.mjs";
import { validateNpmConsumerSmokeRequest } from "../../../../src/validation/stages/smoke/validate-npm-consumer-smoke-request.mjs";

const root = process.cwd();
const target = resolve(root, "..", "smoke-consumer");
const request = (overrides = {}) =>
  validateNpmConsumerSmokeRequest({
    root,
    target,
    packageJson,
    ...overrides,
  });

test("accepts an absolute caller-selected consumer outside the source checkout", () => {
  expect(request()).toEqual({ targetRoot: target });
});

test("accepts a caller-selected parent-relative consumer path", () => {
  expect(request({ target: "../smoke-consumer" })).toEqual({
    targetRoot: resolve(root, "..", "smoke-consumer"),
  });
});

test("rejects missing targets and source checkout targets", () => {
  expect(request({ target: " " })).toEqual({
    error: "Supply one existing consumer with --target <path>.",
  });
  expect(request({ target: root })).toEqual({
    error: "Smoke target must be a separate consumer repository.",
  });
});

test("rejects invalid package publication metadata before smoke setup", () => {
  expect(request({ packageJson: { ...packageJson, publishConfig: {} } })).toEqual({
    error: "Public npm packages must enable npm provenance.",
  });
  expect(
    request({
      packageJson: {
        ...packageJson,
        name: undefined,
        eliware: { apply: ["application", "cli", "npm-published"] },
        scripts: { pack: "eliware-test --pack" },
      },
    }),
  ).toEqual({
    error: "Source package name and version are required for tarball smoke.",
  });
});

const roots = [];
const run = jest.fn();
const resolveCommand = jest.fn(() => ["npm", []]);

afterEach(async () => {
  await removeRoots(roots);
  roots.length = 0;
  run.mockClear();
  resolveCommand.mockClear();
});

test("returns consumer metadata errors before smoke setup", async () => {
  const fixture = await createSmokeTarget(roots);
  await writeFile(join(fixture.target, "package.json"), JSON.stringify({ scripts: {} }));
  await expect(
    runNpmConsumerSmoke({
      root: fixture.source,
      target: fixture.target,
      packageJson,
      run,
      resolveCommand,
      env: {},
    }),
  ).resolves.toContain("must define an npm test script");
  expect(run).not.toHaveBeenCalled();
  expect(resolveCommand).not.toHaveBeenCalled();
});

test("validates package metadata and target identity before capturing state", async () => {
  const fixture = await createSmokeTarget(roots);
  const captureState = jest.fn();
  const options = { root: fixture.source, packageJson, run, resolveCommand, env: {}, captureState };
  await expect(
    runNpmConsumerSmoke({
      ...options,
      target: fixture.target,
      packageJson: { ...packageJson, publishConfig: {} },
    }),
  ).resolves.toContain("provenance");
  const alias = join(dirname(fixture.target), "source-alias");
  await symlink(fixture.source, alias, process.platform === "win32" ? "junction" : "dir");
  await expect(runNpmConsumerSmoke({ ...options, target: alias })).resolves.toContain(
    "resolve outside the source checkout",
  );
  expect(captureState).not.toHaveBeenCalled();
  expect(run).not.toHaveBeenCalled();
});
