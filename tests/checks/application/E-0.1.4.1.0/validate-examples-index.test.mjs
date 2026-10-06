import { expect, test } from "@jest/globals";
import { validateExamplesIndex } from "../../../../src/checks/application/E-0.1.4.1.0/validate-examples-index.mjs";

test("skips the examples index when no JavaScript example exists", async () => {
  await expect(
    validateExamplesIndex({
      repositoryInventory: {
        documentationFiles: async ({ predicate }) => ["README.md"].filter(predicate),
      },
    }),
  ).resolves.toEqual([]);
});

test("requires and validates the examples index when JavaScript examples exist", async () => {
  const inventory = {
    documentationFiles: async ({ includeGenerated, predicate }) => {
      expect(includeGenerated).toBe(true);
      return ["README.md", "a.mjs", "nested/b.js", "dist/generated.mjs"].filter(predicate);
    },
    readText: async () => "[a](a.mjs)",
  };
  await expect(
    validateExamplesIndex({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toContain("examples/README.md must link nested/b.js.");
  await expect(
    validateExamplesIndex({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toContain("examples/README.md must link dist/generated.mjs.");
});

test("reports an unavailable repository inventory", async () => {
  const inventory = {
    documentationFiles: async () => {
      throw new Error("read failed");
    },
  };
  await expect(validateExamplesIndex({ repositoryInventory: inventory })).resolves.toEqual([
    "examples/ could not be inspected for JavaScript examples.",
  ]);
});

test("accepts a missing examples directory", async () => {
  const inventory = {
    documentationFiles: async () => {
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    },
  };
  await expect(validateExamplesIndex({ repositoryInventory: inventory })).resolves.toEqual([]);
});

test("requires an examples index when examples exist", async () => {
  await expect(
    validateExamplesIndex({
      repositoryInventory: {
        documentationFiles: async ({ predicate }) => ["demo.js"].filter(predicate),
      },
    }),
  ).resolves.toEqual(["examples/README.md is required when examples/ contains JavaScript files."]);
});

test("reports a missing default context", async () => {
  await expect(validateExamplesIndex()).resolves.toEqual([
    "examples/ could not be inspected for JavaScript examples.",
  ]);
});
