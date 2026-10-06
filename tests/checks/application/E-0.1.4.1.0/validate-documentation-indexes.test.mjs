import { expect, test } from "@jest/globals";
import { validateDocumentationIndexes } from "../../../../src/checks/application/E-0.1.4.1.0/validate-documentation-indexes.mjs";

test("checks the docs index against all Markdown paths", async () => {
  const inventory = {
    documentationFiles: async ({ predicate }) =>
      ["README.md", "guide.md", "nested/topic.md"].filter(predicate),
    readText: async (path) =>
      path.endsWith("docs/README.md") ? "- [Guide](guide.md)" : "[Documentation](docs/README.md)",
  };
  await expect(
    validateDocumentationIndexes({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toContain("docs/README.md must link nested/topic.md.");
});

test("requires a root README link to the docs index", async () => {
  const inventory = {
    documentationFiles: async ({ predicate }) => ["README.md"].filter(predicate),
    readText: async () => "# Documentation",
  };
  await expect(
    validateDocumentationIndexes({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toContain("README.md must link docs/README.md.");
});

test("reports a missing default context", async () => {
  await expect(validateDocumentationIndexes()).resolves.toEqual([
    "docs/README.md and its Markdown index are required.",
  ]);
});

test("reports missing index and inaccessible docs", async () => {
  await expect(
    validateDocumentationIndexes({
      repositoryInventory: {
        documentationFiles: async () => ["guide.md"],
        readText: async () => {
          throw new Error("missing");
        },
      },
    }),
  ).resolves.toEqual([
    "docs/README.md is required.",
    "README.md must link docs/README.md.",
    "docs/README.md is required to index documentation.",
  ]);
});

test("reports missing docs directory", async () => {
  await expect(
    validateDocumentationIndexes({
      repositoryInventory: {
        documentationFiles: async () => {
          throw new Error("missing");
        },
      },
    }),
  ).resolves.toEqual(["docs/README.md and its Markdown index are required."]);
});
