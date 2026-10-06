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
    files: async (view) =>
      view === "source"
        ? ["src/run.mjs", "src/launch.mjs", "tests/run.test.mjs"]
        : ["nested/jest.config.ts"],
    readText: async (path) => texts.get(path.replaceAll("\\", "/").replace("repo/", "")) ?? "",
  };
  const errors = await validateJestSourcePolicy({ root: "repo", repositoryInventory: inventory });
  expect(errors).toEqual([
    "src/run.mjs must not import or invoke a test runner or coverage tool.",
    "src/run.mjs must not exclude production coverage.",
    "src/launch.mjs must not import or invoke a test runner or coverage tool.",
    "src/launch.mjs must not exclude production coverage.",
    "nested/jest.config.ts is a separate Jest configuration file.",
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

test("rejects unreadable source files", async () => {
  const inventory = {
    files: async (view) => (view === "source" ? ["src/missing.mjs"] : []),
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
