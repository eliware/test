import { expect, test } from "@jest/globals";
import { validateDocumentationIndexes } from "../../../../../src/checks/general/E-0.1.0.1.12/validate/documentation-indexes.mjs";

test("checks maintained docs and excludes generated Markdown paths", async () => {
  const inventory = {
    documentationFiles: async ({ predicate, includeGenerated = false }) => {
      expect(includeGenerated).toBe(false);
      return ["README.md", "guide.md", "nested/topic.md", "build/generated.md"].filter(
        (path) => predicate(path.split("/").at(-1)) && !path.startsWith("build/"),
      );
    },
    readText: async (path) =>
      path.replaceAll("\\", "/").endsWith("docs/README.md")
        ? "- [Guide](guide.md)\n- [Topic](nested/topic.md)"
        : "[Documentation](docs/README.md)",
  };
  await expect(
    validateDocumentationIndexes({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toEqual([]);
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
