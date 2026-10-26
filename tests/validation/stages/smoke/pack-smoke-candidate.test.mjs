import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { nextPatchVersion } from "../../../../test-fixtures/helpers/project-version.mjs";
import { packageJson, packedFiles } from "../../../../test-fixtures/helpers/smoke-package.mjs";

const readFile = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));

const { packSmokeCandidate } =
  await import("../../../../src/validation/stages/smoke/pack-smoke-candidate.mjs");

const root = "C:/source";
const packDirectory = join(root, "pack");

function validManifest() {
  return JSON.stringify([
    {
      name: packageJson.name,
      version: packageJson.version,
      filename: "candidate.tgz",
      files: packedFiles.map((path) => ({ path })),
    },
  ]);
}

function options(run, stdout = validManifest()) {
  return {
    root,
    packageJson,
    run: async (...args) => ({ code: 0, stdout, args }),
    command: "npm",
    prefix: [],
    packDirectory,
    env: {},
    ...run,
  };
}

beforeEach(() => {
  readFile.mockReset().mockResolvedValue(Buffer.from("candidate"));
});

test("packs and validates the candidate, reporting its digest", async () => {
  const run = jest.fn(async (_command, args, runOptions) => ({
    code: 0,
    stdout: validManifest(),
    args,
    options: runOptions,
  }));
  const result = await packSmokeCandidate(options({ run }));

  expect(result.tarball).toBe(join(packDirectory, "candidate.tgz"));
  expect(result.digest).toMatch(/^[a-f0-9]{64}$/u);
  expect(readFile).toHaveBeenCalledWith(result.tarball);
  expect(run).toHaveBeenCalledWith(
    "npm",
    ["pack", "--ignore-scripts", "--json", "--pack-destination", packDirectory],
    { cwd: root, env: {}, maxOutputLength: 1_000_000 },
  );
});

test.each([
  [{ code: 1, stderr: "pack failed" }, "pack failed: pack failed"],
  [{ code: 1 }, "pack failed."],
  [{ code: 0, stdout: null }, "safe tarball filename"],
  [{ code: 0, stdout: "not-json" }, "safe tarball filename"],
])("rejects unsuccessful or invalid npm pack results %#", async (result, message) => {
  await expect(packSmokeCandidate(options({ run: async () => result }))).rejects.toThrow(message);
});

test.each([
  [
    (stdout) =>
      stdout.replace(`"version":"${packageJson.version}"`, `"version":"${nextPatchVersion}"`),
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
    await expect(packSmokeCandidate(options({}, change(validManifest())))).rejects.toThrow(error);
  },
);

test("rejects a missing tarball after the package manifest passes", async () => {
  readFile.mockRejectedValue(new Error("missing tarball"));

  await expect(packSmokeCandidate(options({}))).rejects.toThrow("missing tarball");
});
