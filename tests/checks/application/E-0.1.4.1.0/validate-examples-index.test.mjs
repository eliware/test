import { expect, test } from "@jest/globals";
import { validateExamplesIndex } from "../../../../src/checks/application/E-0.1.4.1.0/validate-examples-index.mjs";

test("skips the examples index when no JavaScript example exists", async () => {
  await expect(
    validateExamplesIndex({ repositoryInventory: { files: async () => ["examples/readme.md"] } }),
  ).resolves.toEqual([]);
});

test("requires and validates the examples index when JavaScript examples exist", async () => {
  const inventory = {
    files: async () => ["examples/a.mjs", "examples/nested/b.js", "examples/readme.md"],
    readText: async () => "[a](a.mjs)",
  };
  await expect(
    validateExamplesIndex({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toContain("examples/README.md must link nested/b.js.");
});

test("reports an unavailable repository inventory", async () => {
  const inventory = {
    files: async () => {
      throw new Error("read failed");
    },
  };
  await expect(validateExamplesIndex({ repositoryInventory: inventory })).resolves.toEqual([
    "examples/ could not be inspected for JavaScript examples.",
  ]);
});

test("requires an examples index when examples exist", async () => {
  await expect(
    validateExamplesIndex({ repositoryInventory: { files: async () => ["examples/demo.js"] } }),
  ).resolves.toEqual(["examples/README.md is required when examples/ contains JavaScript files."]);
});

test("reports a missing default context", async () => {
  await expect(validateExamplesIndex()).resolves.toEqual([
    "examples/ could not be inspected for JavaScript examples.",
  ]);
});
