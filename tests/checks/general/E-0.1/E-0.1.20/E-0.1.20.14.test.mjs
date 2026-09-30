import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.14.mjs";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";

test("reports direct dependencies without a source or tooling reference", async () => {
  await expect(
    run({
      root: "C:\\repo",
      packageJson: { dependencies: { alpha: "1.0.0" } },
      referencedDependencies: [],
    }),
  ).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("accepts referenced direct dependencies", async () => {
  await expect(
    run({
      root: "C:\\repo",
      packageJson: { dependencies: { alpha: "1.0.0" } },
      referencedDependencies: ["alpha"],
    }),
  ).resolves.toEqual({ ruleId: "E-0.1.20.14", status: "pass", message: "" });
});

test("recognizes package dependencies invoked through their npm script binaries", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-dependency-binaries-"));
  await writeFile(
    join(root, "package-lock.json"),
    JSON.stringify({
      lockfileVersion: 3,
      packages: {
        "node_modules/@eliware/test": { bin: { "eliware-test": "bin/eliware-test.mjs" } },
        "node_modules/typescript": { bin: { tsc: "bin/tsc" } },
      },
    }),
  );
  await expect(
    run({
      root,
      packageJson: {
        devDependencies: { "@eliware/test": "^9.0.0", typescript: "^7.0.0" },
        scripts: { test: "eliware-test", typecheck: "tsc --noEmit" },
      },
    }),
  ).resolves.toEqual({ ruleId: "E-0.1.20.14", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("passes when no direct dependency categories are declared", async () => {
  await expect(run({ packageJson: {} })).resolves.toEqual({
    ruleId: "E-0.1.20.14",
    status: "pass",
    message: "",
  });
});

test("includes optional and peer dependencies in the usage check", async () => {
  await expect(
    run({
      packageJson: {
        devDependencies: { dev: "1.0.0" },
        optionalDependencies: { optional: "1.0.0" },
        peerDependencies: { peer: "1.0.0" },
      },
      referencedDependencies: ["dev", "optional", "peer"],
    }),
  ).resolves.toEqual({ ruleId: "E-0.1.20.14", status: "pass", message: "" });
});

test("fails when dependency usage is uncertain", async () => {
  await expect(
    run({
      packageJson: { dependencies: { alpha: "1.0.0" } },
      referencedDependencies: Object.assign([], { uncertain: true }),
    }),
  ).resolves.toEqual({
    ruleId: "E-0.1.20.14",
    status: "fail",
    message: "Dependency usage is dynamically constructed and cannot be proven unused or used.",
  });
});

test("reports dependency inspection failures", async () => {
  await expect(
    run({ root: "C:\\missing-repository", packageJson: { dependencies: { alpha: "1.0.0" } } }),
  ).resolves.toEqual(
    expect.objectContaining({
      ruleId: "E-0.1.20.14",
      status: "fail",
      message: expect.stringContaining("Dependency usage could not be inspected"),
    }),
  );
});

test("shares inventory reads and parsed source during dependency inspection", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-dependency-inventory-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "index.mjs"), 'import alpha from "alpha";\n');
  const repositoryInventory = createRepositoryInventory(root);
  await expect(
    run({
      root,
      packageJson: { dependencies: { alpha: "1.0.0" } },
      repositoryInventory,
      parseAst: repositoryInventory.parseAst,
    }),
  ).resolves.toEqual({ ruleId: "E-0.1.20.14", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});
