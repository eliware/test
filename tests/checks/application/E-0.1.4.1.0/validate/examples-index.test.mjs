import { expect, test } from "@jest/globals";
import { validateExamplesIndex } from "../../../../../src/checks/application/E-0.1.4.1.0/validate/examples-index.mjs";

test("skips the examples index when no JavaScript example exists", async () => {
  await expect(
    validateExamplesIndex({
      repositoryInventory: {
        documentationFiles: async ({ predicate }) => ["README.md"].filter(predicate),
      },
    }),
  ).resolves.toEqual([]);
});

test("indexes maintained JavaScript examples and excludes generated paths", async () => {
  const inventory = {
    documentationFiles: async ({ includeGenerated = false, predicate }) => {
      expect(includeGenerated).toBe(false);
      return ["README.md", "a.mjs", "nested/b.js", "dist/generated.mjs"].filter(
        (path) => predicate(path) && !path.startsWith("dist/"),
      );
    },
    readText: async () => "[a](a.mjs)\n[b](nested/b.js)",
  };
  await expect(
    validateExamplesIndex({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toEqual([]);
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
