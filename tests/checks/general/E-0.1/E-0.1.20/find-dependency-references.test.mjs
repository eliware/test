import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";
import { findDependencyReferences } from "../../../../../src/checks/general/E-0.1/E-0.1.20/find-dependency-references.mjs";

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
  await writeFile(join(root, "src", "module.js"), 'import "zeta";\n');
  await writeFile(join(root, "oxlint.config.json"), JSON.stringify({ plugin: "epsilon" }));
  const packageJson = {
    dependencies: {
      alpha: "1.0.0",
      zeta: "1.0.0",
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
    expect.arrayContaining([
      "alpha",
      "@scope/beta",
      "gamma",
      "delta",
      "epsilon",
      "jest",
      "prettier",
      "oxlint",
      "zeta",
    ]),
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

test("counts the direct linter used by the self-hosted CLI package", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-self-hosted-dependencies-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "clean.mjs"), "export const value = 1;\n");
  await expect(
    findDependencyReferences(root, {
      name: "@eliware/test",
      dependencies: { oxlint: "1.0.0" },
      scripts: { lint: "node bin/eliware-test.mjs --lint" },
    }),
  ).resolves.toEqual(expect.arrayContaining(["oxlint"]));
  await rm(root, { recursive: true, force: true });
});

test("derives a scoped string bin name used by Knit validation", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-knit-dependency-"));
  try {
    await mkdir(join(root, ".knit"));
    await writeFile(
      join(root, ".knit", "custom-check.mjs"),
      `
        import { spawn } from "node:child_process";
        const localBin = new URL(
          \`../node_modules/.bin/vyops${process.platform === "win32" ? ".cmd" : ""}\`,
          import.meta.url,
        );
        spawn(localBin, ["preflight", "config.boot"]);
      `,
    );
    await writeFile(
      join(root, ".knit", "direct-check.mjs"),
      `
        import { execFileSync } from "node:child_process";
        execFileSync("node", ["node_modules/.bin/vyops", "preflight", "config.boot"]);
      `,
    );
    await writeFile(
      join(root, "package-lock.json"),
      JSON.stringify({
        lockfileVersion: 3,
        packages: {
          "node_modules/@eliware/vyops": { bin: "bin/vyops" },
          "node_modules/no-bin": {},
        },
      }),
    );
    const packageJson = {
      devDependencies: { "@eliware/vyops": "^2.1.1", "no-bin": "1.0.0" },
    };
    const inventory = createRepositoryInventory(root);
    const files = await inventory.repositoryFiles();

    await expect(
      findDependencyReferences(root, packageJson, files, inventory.parseAst, inventory),
    ).resolves.toEqual(expect.arrayContaining(["@eliware/vyops"]));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not count a dependency referenced only by a GitHub Actions workflow", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-only-dependency-"));
  try {
    await mkdir(join(root, ".github", "workflows"), { recursive: true });
    await writeFile(
      join(root, ".github", "workflows", "ci.yaml"),
      "jobs:\n  validate:\n    steps:\n      - run: node node_modules/.bin/vyops preflight config.boot\n",
    );
    await writeFile(
      join(root, "package-lock.json"),
      JSON.stringify({
        lockfileVersion: 3,
        packages: { "node_modules/@eliware/vyops": { bin: { vyops: "bin/vyops" } } },
      }),
    );
    const references = await findDependencyReferences(root, {
      devDependencies: { "@eliware/vyops": "2.1.1" },
    });
    expect(references).not.toContain("@eliware/vyops");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
