import { expect, test } from "@jest/globals";
import { validateLibraryLayout } from "../../../../src/checks/library/E-0.1.3.1.2/validate-library-layout.mjs";

test("reports a missing repository inventory", async () => {
  await expect(validateLibraryLayout()).resolves.toEqual([
    "Repository inventory is required for library layout checks.",
  ]);
});

test("checks mirrored source and tests for the valid library profile set", async () => {
  const testContent =
    'import { test } from "@jest/globals"; import "../src/index.mjs"; test("works", () => {});';
  const inventory = {
    files: async () => ["src/index.mjs", "tests/index.test.mjs"],
    readText: async (path) => (path.endsWith("index.test.mjs") ? testContent : "export {};"),
  };
  await expect(
    validateLibraryLayout({
      root: "/repo",
      packageJson: { eliware: { apply: ["general", "library"] } },
      repositoryInventory: inventory,
    }),
  ).resolves.toEqual([]);
});

test("checks library layout without Application profile branches", async () => {
  const inventory = { files: async () => ["bin/command.mjs", "lib/worker.mjs"] };
  await expect(
    validateLibraryLayout({
      packageJson: { eliware: { apply: ["general", "library"] } },
      repositoryInventory: inventory,
    }),
  ).resolves.toEqual([
    "bin/command.mjs is outside the allowed library source and test directories.",
    "lib/worker.mjs is outside the allowed library source and test directories.",
  ]);
});
