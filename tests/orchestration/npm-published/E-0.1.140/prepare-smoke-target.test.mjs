import { afterEach, expect, test } from "@jest/globals";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  hasPackageDependency,
  prepareSmokeTarget,
} from "../../../../src/orchestration/npm-published/E-0.1.140/prepare-smoke-target.mjs";

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

test("removes the installed package without changing consumer manifests or lockfiles", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-prepare-smoke-test-"));
  roots.push(root);
  const installed = join(root, "node_modules", "@eliware", "test");
  await mkdir(installed, { recursive: true });
  await writeFile(join(installed, "package.json"), "old package");
  const manifest = '{"devDependencies":{"@eliware/test":"10.0.0"}}\n';
  const lockfile = '{"lockfileVersion":3}\n';
  await writeFile(join(root, "package.json"), manifest);
  await writeFile(join(root, "package-lock.json"), lockfile);

  await prepareSmokeTarget({ targetRoot: root, packageName: "@eliware/test" });

  await expect(readFile(join(root, "package.json"), "utf8")).resolves.toBe(manifest);
  await expect(readFile(join(root, "package-lock.json"), "utf8")).resolves.toBe(lockfile);
  await expect(readFile(join(installed, "package.json"), "utf8")).rejects.toThrow();
});
