import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createValidationContext } from "../../src/orchestrators/create-validation-context.mjs";
import { createRepositoryInventory } from "../../src/checks/create-repository-inventory.mjs";
import { run as runKnitOrder } from "../../src/checks/general/E-0.1/E-0.1.10/E-0.1.10.1.mjs";
import { run as runLicense } from "../../src/checks/general/E-0.1/E-0.1.23.mjs";
import { runPureExportBarrelPolicy } from "../../src/checks/general/E-0.1/E-0.1.20/validate-pure-export-barrels.mjs";
import { runNoCoverageIgnore } from "../../src/checks/general/E-0.1/validate-no-coverage-ignore.mjs";

async function fixture(prefix) {
  return mkdtemp(join(tmpdir(), prefix));
}

test("creates the complete execution context from validation options", () => {
  const timing = {};
  const writeOutput = () => {};
  expect(
    createValidationContext(
      "root",
      { name: "fixture" },
      {
        executeJest: true,
        executeLint: true,
        executeAudit: true,
        executePack: true,
        executePackageChecks: true,
        executeFormat: true,
        mode: "focused",
        modeRuleId: null,
        jestArgs: ["tests/example.test.mjs"],
        toolArgs: ["--watch"],
        timing,
        writeOutput,
      },
    ),
  ).toEqual({
    root: "root",
    packageJson: { name: "fixture" },
    executeJest: true,
    executeLint: true,
    executeAudit: true,
    executePack: true,
    executePackageChecks: true,
    executeFormat: true,
    mode: "focused",
    modeRuleId: null,
    repositoryInventory: expect.objectContaining({
      files: expect.any(Function),
    }),
    parseAst: expect.any(Function),
    jestArgs: ["tests/example.test.mjs"],
    toolArgs: ["--watch"],
    timing,
    writeOutput,
  });
});

test("creates default options without enabling stages", () => {
  expect(createValidationContext("root", {})).toEqual({
    root: "root",
    packageJson: {},
    executeJest: false,
    executeLint: false,
    executeAudit: false,
    executePack: false,
    executePackageChecks: false,
    executeFormat: false,
    mode: null,
    modeRuleId: null,
    repositoryInventory: expect.objectContaining({
      files: expect.any(Function),
    }),
    parseAst: expect.any(Function),
    jestArgs: [],
    toolArgs: [],
    timing: undefined,
    writeOutput: undefined,
  });
});

test("preserves an invocation environment in the validation context", () => {
  const env = { PATH: "invocation-path" };
  expect(createValidationContext("root", {}, { env })).toEqual(expect.objectContaining({ env }));
});

test("preserves a shared AST parser and optional run scope data", () => {
  const parseAst = () => {};
  const repositoryFiles = ["src/index.mjs"];
  const focusedScope = { paths: repositoryFiles };

  expect(createValidationContext("root", {}, { parseAst, repositoryFiles, focusedScope })).toEqual({
    root: "root",
    packageJson: {},
    executeJest: false,
    executeLint: false,
    executeAudit: false,
    executePack: false,
    executePackageChecks: false,
    executeFormat: false,
    mode: null,
    modeRuleId: null,
    jestArgs: [],
    toolArgs: [],
    timing: undefined,
    writeOutput: undefined,
    repositoryInventory: expect.objectContaining({ files: expect.any(Function) }),
    parseAst,
    repositoryFiles,
    focusedScope,
  });
});

test("Knit command validation shares the deployment configuration read", async () => {
  const root = await fixture("eliware-knit-cache-sharing-");
  const deployment = join(root, ".knit", "deploy.yaml");
  await mkdir(join(root, ".knit"), { recursive: true });
  await writeFile(
    deployment,
    "version: 1\non:\n  push:\n    deployments:\n      - commands:\n          - git pull --ff-only origin main\n          - npm ci\n          - npm test\n",
  );
  const reads = new Map();
  const repositoryInventory = createRepositoryInventory(root, {
    read: async (...args) => {
      const path = args[0];
      reads.set(path, (reads.get(path) ?? 0) + 1);
      return readFile(...args);
    },
  });
  const context = createValidationContext(root, {}, { repositoryInventory });
  try {
    await expect(runKnitOrder(context)).resolves.toMatchObject({ status: "pass" });
    expect(reads.get(deployment)).toBe(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("independent repository checks share cached LICENSE and source text", async () => {
  const root = await fixture("eliware-content-cache-sharing-");
  await mkdir(join(root, "src"));
  const license = join(root, "LICENSE");
  const barrel = join(root, "src", "entry.mjs");
  await writeFile(
    license,
    'MIT License\nCopyright (c) 2026 Eliware\nPermission is hereby granted\nTHE SOFTWARE IS PROVIDED "AS IS"\nWITHOUT WARRANTY OF ANY KIND\nIN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE\n',
  );
  await writeFile(barrel, '/* istanbul ignore file */\nexport { value } from "./value.mjs";\n');
  const reads = new Map();
  const repositoryInventory = createRepositoryInventory(root, {
    includeTestResultsUnder: ["src"],
    read: async (...args) => {
      const path = args[0];
      reads.set(path, (reads.get(path) ?? 0) + 1);
      return readFile(...args);
    },
  });
  const context = createValidationContext(
    root,
    { main: "./src/entry.mjs", eliware: { apply: ["library"] } },
    { repositoryInventory },
  );
  try {
    await expect(runLicense(context)).resolves.toMatchObject({ status: "pass" });
    await expect(runNoCoverageIgnore({ ...context, ruleId: "E-0.1.40.8" })).resolves.toMatchObject({
      status: "pass",
    });
    await expect(
      runPureExportBarrelPolicy({ ...context, ruleId: "E-0.1.40.14" }),
    ).resolves.toMatchObject({ status: "pass" });
    expect(reads.get(license)).toBe(1);
    expect(reads.get(barrel)).toBe(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
