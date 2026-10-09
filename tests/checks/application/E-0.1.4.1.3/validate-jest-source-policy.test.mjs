import { expect, test } from "@jest/globals";
import { validateJestSourcePolicy } from "../../../../src/checks/application/E-0.1.4.1.3/validate-jest-source-policy.mjs";

test("rejects runner imports, coverage exclusions, and separate config files", async () => {
  const texts = new Map([
    [
      "src/run.mjs",
      'const load = createRequire(import.meta.url); load("jest-cli"); /* c8 ignore next */',
    ],
    [
      "src/launch.mjs",
      'spawn("node", ["node_modules/.bin/vitest/vitest.mjs"]); /* v8 ignore next */',
    ],
    ["tests/run.test.mjs", 'import { test } from "@jest/globals";'],
  ]);
  const inventory = {
    files: async () => [
      "src/run.mjs",
      "src/launch.mjs",
      "tests/run.test.mjs",
      "nested/jest.config.ts",
    ],
    readText: async (path) => texts.get(path.replaceAll("\\", "/").replace("repo/", "")) ?? "",
  };
  const errors = await validateJestSourcePolicy({ root: "repo", repositoryInventory: inventory });
  expect(errors).toEqual([
    "src/run.mjs must not import or invoke a test runner or coverage tool.",
    "src/run.mjs must not exclude production coverage.",
    "src/launch.mjs must not import or invoke a test runner or coverage tool.",
    "src/launch.mjs must not exclude production coverage.",
    "nested/jest.config.ts is a separate test runner or coverage configuration file.",
  ]);
});

test("reports inventory failures", async () => {
  await expect(
    validateJestSourcePolicy({
      repositoryInventory: {
        files: async () => {
          throw new Error("inventory");
        },
      },
    }),
  ).resolves.toEqual(["Jest source policy could not read the repository inventory."]);
});

test("allows clean sources and the supported Jest API", async () => {
  const inventory = {
    files: async () => ["src/run.mjs"],
    readText: async () => 'import { test } from "@jest/globals";',
  };
  await expect(
    validateJestSourcePolicy({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toEqual([]);
});

test("allows Istanbul ignore only in the primary library export barrel", async () => {
  const content = '/* istanbul ignore file */\nexport { value } from "./value.mjs";';
  const inventory = { files: async () => ["src/index.mjs"], readText: async () => content };
  await expect(
    validateJestSourcePolicy({
      root: "repo",
      packageJson: {
        main: "./src/index.mjs",
        eliware: { apply: ["library"] },
      },
      repositoryInventory: inventory,
    }),
  ).resolves.toEqual([]);
  await expect(
    validateJestSourcePolicy({
      root: "repo",
      packageJson: {
        main: "./src/index.mjs",
        eliware: { apply: ["library", "application"] },
      },
      repositoryInventory: inventory,
    }),
  ).resolves.toContain("src/index.mjs must not exclude production coverage.");
});

test("allows the harness API and checks its package scripts", async () => {
  const inventory = {
    files: async () => ["src/run.mjs", "package.json"],
    readText: async (path) =>
      path.endsWith("package.json")
        ? '{"scripts":{"test":"vitest run"}}'
        : 'import "istanbul-lib-instrument"; import { test } from "@jest/globals";',
  };
  await expect(
    validateJestSourcePolicy({
      root: "repo",
      packageJson: { name: "@eliware/test" },
      repositoryInventory: inventory,
    }),
  ).resolves.toContain("package.json must not import or invoke a test runner or coverage tool.");
});

test("rejects unreadable source files", async () => {
  const inventory = {
    files: async () => ["src/missing.mjs"],
    readText: async () => {
      throw new Error("read failed");
    },
  };
  await expect(
    validateJestSourcePolicy({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toEqual(["src/missing.mjs could not be read to check Jest source policy."]);
});

test("reports errors from the default context", async () => {
  await expect(validateJestSourcePolicy()).resolves.toEqual([
    "Jest source policy could not read the repository inventory.",
  ]);
});

test.each([
  ["src/dynamic.mts", "import(`jest`);"],
  ["tests/runner.jsx", 'spawn("jest");'],
  ["src/alternative.tsx", 'import("@vitest/coverage-v8");'],
  ["tests/runner.mjs", 'import("@vitest/runner");'],
  ["scripts/run.mjs", 'import("@tapjs/run");'],
  ["vite.config.mts", 'import { defineConfig } from "vitest/config";'],
])("rejects runner references in %s", async (path, content) => {
  const inventory = {
    files: async () => [path],
    readText: async () => content,
  };
  await expect(
    validateJestSourcePolicy({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toContain(`${path} must not import or invoke a test runner or coverage tool.`);
});

test("rejects alternative runners in package scripts", async () => {
  const inventory = {
    files: async () => ["package.json"],
    readText: async () => '{"scripts":{"test:extra":"vitest run"}}',
  };
  await expect(
    validateJestSourcePolicy({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toContain("package.json must not import or invoke a test runner or coverage tool.");
});

test("rejects Node test runner flags after Node options", async () => {
  const inventory = {
    files: async () => ["package.json"],
    readText: async () => '{"scripts":{"test:extra":"node --experimental-test-coverage --test"}}',
  };
  await expect(
    validateJestSourcePolicy({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toContain("package.json must not import or invoke a test runner or coverage tool.");
});

test.each([
  "jest.config.mts",
  ".jestrc.cjs",
  "nested/jest.config.json5",
  "vitest.config.js",
  ".mocharc.yaml",
  ".nycrc.json",
  "playwright.config.ts",
  ".babelrc",
  ".taprc",
  "uvu.config.mjs",
  "vitest.workspace.mts",
])("rejects separate Jest config %s", async (path) => {
  const inventory = { files: async () => [path], readText: async () => "" };
  await expect(
    validateJestSourcePolicy({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toContain(`${path} is a separate test runner or coverage configuration file.`);
});
