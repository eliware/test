import { afterEach, expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installSmokeCandidate } from "../../../../src/validation/stages/smoke/install-smoke-candidate.mjs";
import { packageJson } from "../../../../test-fixtures/npm-consumers/smoke-test-support.mjs";

let roots = [];

afterEach(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
  roots = [];
});

async function setup() {
  const targetRoot = await mkdtemp(join(tmpdir(), "eliware-install-smoke-test-"));
  roots.push(targetRoot);
  const installed = join(targetRoot, "node_modules", "@eliware", "test");
  await mkdir(installed, { recursive: true });
  await writeFile(
    join(installed, "package.json"),
    JSON.stringify({ name: packageJson.name, version: packageJson.version }),
  );
  return { targetRoot, installed };
}

async function installMock(targetRoot, version = packageJson.version, name = packageJson.name) {
  const installed = join(targetRoot, "node_modules", "@eliware", "test");
  await mkdir(installed, { recursive: true });
  await writeFile(join(installed, "package.json"), JSON.stringify({ name, version }));
}

async function installWithCli(targetRoot, manifest) {
  const installed = join(targetRoot, "node_modules", "@eliware", "test");
  await mkdir(join(installed, "bin"), { recursive: true });
  await writeFile(join(installed, "package.json"), JSON.stringify(manifest));
  await writeFile(join(installed, "bin", "eliware-test.mjs"), "export {};\n");
}

const options = (targetRoot, run) => ({
  targetRoot,
  packageJson,
  tarball: "candidate.tgz",
  command: "npm",
  prefix: [],
  env: {},
  resolveModule: (specifier) => specifier,
  run,
});

test("installs the tarball without changing a lockfile and runs consumer npm test", async () => {
  const { targetRoot } = await setup();
  const calls = [];
  await installSmokeCandidate(
    options(targetRoot, async (_command, args, runOptions) => {
      calls.push({ args, options: runOptions });
      if (args[0] === "install") await installMock(targetRoot);
      return { code: 0 };
    }),
  );
  expect(calls.map(({ args }) => args[0])).toEqual(["install", "test"]);
  expect(calls[0].args).toEqual(expect.arrayContaining(["--package-lock=false", "--no-save"]));
  expect(calls[0].options.cwd).toBe(targetRoot);
  expect(calls[1].options.env.ELIWARE_TEST_SMOKE_CANDIDATE).toBe(packageJson.name);
});

test.each([
  [{ code: 1, stderr: "install failed" }, "install failed"],
  [{ code: 1 }, "Tarball installation failed."],
])("reports tarball installation failures %#", async (installResult, message) => {
  const { targetRoot } = await setup();
  await expect(
    installSmokeCandidate(options(targetRoot, async () => installResult)),
  ).rejects.toThrow(message);
});

test("rejects a mismatched installed version", async () => {
  const { targetRoot } = await setup();
  await expect(
    installSmokeCandidate(
      options(targetRoot, async () => {
        await installMock(targetRoot, "12.0.1");
        return { code: 0 };
      }),
    ),
  ).rejects.toThrow("Installed package version 12.0.1 does not match 12.0.0");
});

test("rejects a mismatched installed package name", async () => {
  const { targetRoot } = await setup();
  await expect(
    installSmokeCandidate(
      options(targetRoot, async () => {
        await installMock(targetRoot, packageJson.version, "@other/package");
        return { code: 0 };
      }),
    ),
  ).rejects.toThrow("Installed package @other/package does not match @eliware/test");
});

test("rejects a CLI resolution outside the installed smoke package", async () => {
  const { targetRoot } = await setup();
  await expect(
    installSmokeCandidate({
      ...options(targetRoot, async (_command, args) => {
        if (args[0] === "install") await installMock(targetRoot);
        return { code: 0 };
      }),
      resolveModule: () => join(targetRoot, "other-package", "bin", "eliware-test.mjs"),
    }),
  ).rejects.toThrow("Consumer does not resolve the installed smoke package CLI entrypoint");
});

test("resolves a string-shaped CLI entrypoint", async () => {
  const { targetRoot } = await setup();
  const run = async (_command, args) => {
    if (args[0] === "install") await installMock(targetRoot);
    return { code: 0 };
  };
  await expect(
    installSmokeCandidate({
      ...options(targetRoot, run),
      packageJson: { ...packageJson, bin: "bin/eliware-test.mjs" },
      resolveModule: () =>
        join(targetRoot, "node_modules", "@eliware", "test", "bin", "eliware-test.mjs"),
    }),
  ).resolves.toBeUndefined();
});

test("resolves a CLI path inside the installed package without requiring an export", async () => {
  const { targetRoot } = await setup();
  const resolved = [];
  const resolveModule = (specifier, parent) => {
    resolved.push([specifier, parent]);
    return specifier;
  };
  await installSmokeCandidate({
    ...options(targetRoot, async (_command, args) => {
      if (args[0] === "install") await installMock(targetRoot);
      return { code: 0 };
    }),
    resolveModule,
  });
  expect(resolved).toEqual([
    [
      join(targetRoot, "node_modules", "@eliware", "test", "bin", "eliware-test.mjs"),
      join(targetRoot, "package.json"),
    ],
  ]);
});

test("uses createRequire for CLI packages and skips resolution without a bin entry", async () => {
  const { targetRoot } = await setup();
  const manifest = { ...packageJson, bin: { "eliware-test": "bin/eliware-test.mjs" } };
  const run = async (_command, args) => {
    if (args[0] === "install") await installWithCli(targetRoot, manifest);
    return { code: 0 };
  };

  await expect(
    installSmokeCandidate({
      targetRoot,
      packageJson: manifest,
      tarball: "candidate.tgz",
      run,
      command: "npm",
      prefix: [],
      env: {},
    }),
  ).resolves.toBeUndefined();
  const packageWithoutBin = { ...packageJson, bin: undefined };
  const resolveModule = jest.fn();
  const runWithoutBin = async (_command, args) => {
    if (args[0] === "install")
      await installMock(targetRoot, packageWithoutBin.version, packageWithoutBin.name);
    return { code: 0 };
  };

  await expect(
    installSmokeCandidate({
      ...options(targetRoot, runWithoutBin),
      packageJson: packageWithoutBin,
      resolveModule,
    }),
  ).resolves.toBeUndefined();
  expect(resolveModule).not.toHaveBeenCalled();
});

test("reports consumer test failures", async () => {
  const { targetRoot } = await setup();
  await expect(
    installSmokeCandidate(
      options(targetRoot, async (_command, args) => {
        if (args[0] === "test") return { code: 1, stdout: "test failed" };
        await installMock(targetRoot);
        return { code: 0 };
      }),
    ),
  ).rejects.toThrow("Consumer npm test failed: test failed");
});
