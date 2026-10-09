import { expect, test } from "@jest/globals";
import { validateLibraryExamples } from "../../../../src/checks/library/E-0.1.3.1.0/validate-library-examples.mjs";

test("requires one JavaScript module in examples", async () => {
  await expect(
    validateLibraryExamples({
      root: "/repo",
      repositoryInventory: {
        documentationFiles: async (options) => {
          expect(options.directory.replaceAll("\\", "/")).toBe("/repo/examples");
          expect(options.includeGenerated).toBe(true);
          return ["index.cjs", "index.mjs"].filter((name) => options.predicate(name));
        },
      },
    }),
  ).resolves.toEqual([]);
});

test("reports an absent example and an unreadable examples path", async () => {
  await expect(
    validateLibraryExamples({ repositoryInventory: { documentationFiles: async () => [] } }),
  ).resolves.toEqual(["Libraries must provide at least one native-ESM example."]);
  await expect(validateLibraryExamples({ repositoryInventory: {} })).resolves.toEqual([
    "Libraries must provide an examples/ directory with a native-ESM example.",
  ]);
});

test("uses the default context", async () => {
  await expect(validateLibraryExamples()).resolves.toEqual([
    "Libraries must provide an examples/ directory with a native-ESM example.",
  ]);
});
