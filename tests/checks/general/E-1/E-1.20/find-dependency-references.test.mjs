import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { findDependencyReferences } from "../../../../../src/checks/general/E-1/E-1.20/find-dependency-references.mjs";

test("finds imports, re-exports, dynamic imports, requires, scripts, and config references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-dependencies-"));
  await mkdir(join(root, "src"));
  await writeFile(
    join(root, "src", "module.mjs"),
    `
    import "alpha";
    export { value } from "@scope/beta/subpath";
    const load = () => import("gamma");
    const delta = require("delta");
    export { load, delta };
  `,
  );
  await writeFile(join(root, "oxlint.config.json"), JSON.stringify({ plugin: "epsilon" }));
  const packageJson = {
    dependencies: {
      alpha: "1.0.0",
      "@scope/beta": "1.0.0",
      gamma: "1.0.0",
      delta: "1.0.0",
      epsilon: "1.0.0",
      jest: "1.0.0",
      prettier: "1.0.0",
      oxlint: "1.0.0",
    },
    scripts: { tool: "epsilon --check" },
    jest: { preset: "jest" },
    prettier: { plugins: ["prettier"] },
    oxlint: { plugins: ["oxlint"] },
  };
  await expect(findDependencyReferences(root, packageJson)).resolves.toEqual(
    expect.arrayContaining(["alpha", "@scope/beta", "gamma", "delta", "epsilon", "jest", "prettier", "oxlint"]),
  );
  await rm(root, { recursive: true, force: true });
});

test("ignores invalid source/config files and unrelated repository files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-dependencies-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "invalid.mjs"), "export {\n");
  await writeFile(join(root, "notes.txt"), "not a configuration file\n");
  await writeFile(join(root, "jest.config.json"), "not json");
  await writeFile(join(root, "package.json"), "not json");
  await expect(
    findDependencyReferences(root, { dependencies: { alpha: "1.0.0" } }),
  ).resolves.toEqual(expect.arrayContaining([]));
  await rm(root, { recursive: true, force: true });
});

test("accepts repositories with no dependency declarations", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-dependencies-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "clean.mjs"), "export const value = 1;\n");
  await expect(findDependencyReferences(root)).resolves.toHaveLength(0);
  await rm(root, { recursive: true, force: true });
});
