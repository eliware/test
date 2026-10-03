import { afterEach, expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installSmokeCandidate } from "../../../../src/checks/npm-published/E-0.1.140/install-smoke-candidate.mjs";
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

test("installs the tarball and runs the consumer npm test", async () => {
  const { targetRoot } = await setup();
  const calls = [];
  await installSmokeCandidate({
    targetRoot,
    packageJson,
    tarball: "candidate.tgz",
    command: "npm",
    prefix: [],
    env: {},
    run: async (_command, args, options) => {
      calls.push({ args, options });
      if (args[0] === "install" && !args.includes("--package-lock-only")) {
        await mkdir(join(targetRoot, "node_modules", "@eliware", "test"), { recursive: true });
        await writeFile(
          join(targetRoot, "node_modules", "@eliware", "test", "package.json"),
          JSON.stringify({ name: packageJson.name, version: packageJson.version }),
        );
      }
      return { code: 0 };
    },
  });
  expect(calls.map(({ args }) => args[0])).toEqual(["install", "install", "test"]);
  expect(calls[0].args).toContain("--package-lock-only");
  expect(calls[1].args).toContain("--no-save");
  expect(calls[1].options.cwd).toBe(targetRoot);
});

test.each([
  [{ code: 1, stderr: "install failed" }, "install failed"],
  [{ code: 1 }, "Tarball installation failed."],
])("reports tarball installation failures %#", async (installResult, message) => {
  const { targetRoot } = await setup();
  await expect(
    installSmokeCandidate({
      targetRoot,
      packageJson,
      tarball: "candidate.tgz",
      command: "npm",
      prefix: [],
      env: {},
      run: async (_command, args) => {
        if (args.includes("--package-lock-only")) return { code: 0 };
        return installResult;
      },
    }),
  ).rejects.toThrow(message);
});

test.each([{ code: 1, stderr: "lock failed" }, { code: 1 }])(
  "reports temporary lockfile update failures %#",
  async (lockResult) => {
    const { targetRoot } = await setup();
    await expect(
      installSmokeCandidate({
        targetRoot,
        packageJson,
        tarball: "candidate.tgz",
        command: "npm",
        prefix: [],
        env: {},
        run: async () => lockResult,
      }),
    ).rejects.toThrow("Temporary lockfile update failed");
  },
);

test("rejects a mismatched installed version", async () => {
  const { targetRoot, installed } = await setup();
  await writeFile(
    join(installed, "package.json"),
    JSON.stringify({ name: packageJson.name, version: "10.0.0" }),
  );
  await expect(
    installSmokeCandidate({
      targetRoot,
      packageJson,
      tarball: "candidate.tgz",
      command: "npm",
      prefix: [],
      env: {},
      run: async (_command, args) => {
        if (args[0] === "install" && !args.includes("--package-lock-only")) {
          await mkdir(installed, { recursive: true });
          await writeFile(
            join(installed, "package.json"),
            JSON.stringify({ name: packageJson.name, version: "10.0.0" }),
          );
        }
        return { code: 0 };
      },
    }),
  ).rejects.toThrow("Installed package version 10.0.0 does not match 11.0.0");
});

test("reports consumer test failures", async () => {
  const { targetRoot } = await setup();
  await expect(
    installSmokeCandidate({
      targetRoot,
      packageJson,
      tarball: "candidate.tgz",
      command: "npm",
      prefix: [],
      env: {},
      run: async (_command, args) => {
        if (args[0] === "test") return { code: 1, stdout: "test failed" };
        if (!args.includes("--package-lock-only")) {
          await mkdir(join(targetRoot, "node_modules", "@eliware", "test"), {
            recursive: true,
          });
          await writeFile(
            join(targetRoot, "node_modules", "@eliware", "test", "package.json"),
            JSON.stringify({ name: packageJson.name, version: packageJson.version }),
          );
        }
        return { code: 0 };
      },
    }),
  ).rejects.toThrow("Consumer npm test failed: test failed");
});
