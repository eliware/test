import { afterEach, expect, test } from "@jest/globals";
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

async function installMock(targetRoot, version = packageJson.version) {
  const installed = join(targetRoot, "node_modules", "@eliware", "test");
  await mkdir(installed, { recursive: true });
  await writeFile(
    join(installed, "package.json"),
    JSON.stringify({ name: packageJson.name, version }),
  );
}

const options = (targetRoot, run) => ({
  targetRoot,
  packageJson,
  tarball: "candidate.tgz",
  command: "npm",
  prefix: [],
  env: {},
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
  expect(calls[0].args).toContain("--package-lock=false");
  expect(calls[0].args).toContain("--no-save");
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
        await installMock(targetRoot, "10.0.0");
        return { code: 0 };
      }),
    ),
  ).rejects.toThrow("Installed package version 10.0.0 does not match 11.0.0");
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
