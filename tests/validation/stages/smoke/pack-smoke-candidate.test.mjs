import { afterEach, expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { packSmokeCandidate } from "../../../../src/validation/stages/smoke/pack-smoke-candidate.mjs";
import {
  packageJson,
  packedFiles,
} from "../../../../test-fixtures/npm-consumers/smoke-test-support.mjs";

let roots = [];

afterEach(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
  roots = [];
});

async function setup() {
  const root = await mkdtemp(join(tmpdir(), "eliware-pack-smoke-test-"));
  roots.push(root);
  const packDirectory = join(root, "pack");
  await mkdir(packDirectory);
  await writeFile(join(packDirectory, "candidate.tgz"), "candidate");
  const stdout = JSON.stringify([
    {
      name: packageJson.name,
      version: packageJson.version,
      filename: "candidate.tgz",
      files: packedFiles.map((path) => ({ path })),
    },
  ]);
  const run = async (_command, args, options) => ({
    code: 0,
    stdout,
    args,
    options,
  });
  return { root, packDirectory, stdout, run };
}

test("packs and validates the candidate, reporting its digest", async () => {
  const fixture = await setup();
  const result = await packSmokeCandidate({
    root: fixture.root,
    packageJson,
    run: fixture.run,
    command: "npm",
    prefix: [],
    packDirectory: fixture.packDirectory,
    env: {},
  });
  expect(result.tarball).toBe(join(fixture.packDirectory, "candidate.tgz"));
  expect(result.digest).toMatch(/^[a-f0-9]{64}$/u);
});

test.each([
  [{ code: 1, stderr: "pack failed" }, "pack failed: pack failed"],
  [{ code: 1 }, "pack failed."],
  [{ code: 0, stdout: null }, "safe tarball filename"],
  [{ code: 0, stdout: "not-json" }, "safe tarball filename"],
])("rejects unsuccessful or invalid npm pack results %#", async (result, message) => {
  const fixture = await setup();
  await expect(
    packSmokeCandidate({
      root: fixture.root,
      packageJson,
      run: async () => result,
      command: "npm",
      prefix: [],
      packDirectory: fixture.packDirectory,
      env: {},
    }),
  ).rejects.toThrow(message);
});

test.each([
  [
    (stdout) => stdout.replace('"version":"12.0.0"', '"version":"12.0.1"'),
    "version does not match",
  ],
  [
    (stdout) => stdout.replace('"filename":"candidate.tgz"', '"filename":"../candidate.tgz"'),
    "safe",
  ],
  [
    (stdout) => stdout.replace('"path":"docs/README.md"', '"path":"docs-other/README.md"'),
    "outside",
  ],
])(
  "rejects a pack manifest that does not describe the source package %#",
  async (change, error) => {
    const fixture = await setup();
    await expect(
      packSmokeCandidate({
        root: fixture.root,
        packageJson,
        run: async () => ({ code: 0, stdout: change(fixture.stdout) }),
        command: "npm",
        prefix: [],
        packDirectory: fixture.packDirectory,
        env: {},
      }),
    ).rejects.toThrow(error);
  },
);

test("rejects a missing tarball after the package manifest passes", async () => {
  const fixture = await setup();
  await rm(join(fixture.packDirectory, "candidate.tgz"));
  await expect(
    packSmokeCandidate({
      root: fixture.root,
      packageJson,
      run: fixture.run,
      command: "npm",
      prefix: [],
      packDirectory: fixture.packDirectory,
      env: {},
    }),
  ).rejects.toThrow();
});
