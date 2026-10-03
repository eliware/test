import { afterEach, expect, test } from "@jest/globals";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  hasPackageDependency,
  prepareSmokeTarget,
} from "../../../../src/checks/npm-published/E-0.1.140/prepare-smoke-target.mjs";

let roots = [];

afterEach(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
  roots = [];
});

test.each(["dependencies", "devDependencies", "optionalDependencies"])(
  "recognizes the package dependency in %s",
  (field) => {
    expect(hasPackageDependency({ [field]: { "@eliware/test": "10.0.0" } }, "@eliware/test")).toBe(
      true,
    );
    expect(hasPackageDependency({}, "@eliware/test")).toBe(false);
  },
);

test("sets the candidate tarball, updates the lockfile, and removes local install", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-prepare-smoke-test-"));
  roots.push(root);
  const installed = join(root, "node_modules", "@eliware", "test");
  await mkdir(installed, { recursive: true });
  await writeFile(join(installed, "package.json"), "old package");
  const calls = [];
  const targetPackage = { devDependencies: { "@eliware/test": "10.0.0" } };
  await prepareSmokeTarget({
    targetRoot: root,
    targetPackage,
    packageName: "@eliware/test",
    tarball: join(root, "candidate.tgz"),
    run: async (_command, args, options) => {
      calls.push({ args, options });
      return { code: 0 };
    },
    command: "npm",
    prefix: [],
    env: {},
  });
  expect(targetPackage.devDependencies["@eliware/test"]).toMatch(/^file:/);
  await expect(readFile(join(root, "package.json"), "utf8")).resolves.toContain("file:");
  await expect(readFile(join(installed, "package.json"), "utf8")).rejects.toThrow();
  expect(calls[0].args).toContain("--package-lock-only");
  expect(calls[0].options.cwd).toBe(root);
});

test("reports failure to regenerate the temporary lockfile", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-prepare-smoke-test-"));
  roots.push(root);
  await expect(
    prepareSmokeTarget({
      targetRoot: root,
      targetPackage: { devDependencies: { "@eliware/test": "10.0.0" } },
      packageName: "@eliware/test",
      tarball: join(root, "candidate.tgz"),
      run: async () => ({ code: 1 }),
      command: "npm",
      prefix: [],
      env: {},
    }),
  ).rejects.toThrow("Temporary lockfile update failed");
});
