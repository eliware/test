import { expect, test } from "@jest/globals";
import { validateLibraryEntrypoints } from "../../../../../src/checks/library/E-0.1.3.1.1/validate-library/entrypoints.mjs";

test("accepts static runtime exports and paired declarations", async () => {
  const stat = async () => ({ isFile: () => true });
  await expect(
    validateLibraryEntrypoints(
      {
        packageJson: {
          main: "./src/index.mjs",
          exports: { ".": { import: "./src/index.mjs", types: "./src/index.d.ts" } },
          types: "./src/index.d.ts",
        },
      },
      { stat },
    ),
  ).resolves.toEqual([]);
});

test("accepts condition exports for the root entrypoint", async () => {
  const stat = async () => ({ isFile: () => true });
  await expect(
    validateLibraryEntrypoints(
      { packageJson: { main: "./src/index.mjs", exports: { import: "./src/index.mjs" } } },
      { stat },
    ),
  ).resolves.toEqual([]);
});

test("checks declared and discovered declarations and internal barrels", async () => {
  const inventory = {
    files: async () => ["src/index.d.ts", "src/internal.d.ts", "src/internal.mjs"],
    readText: async () => 'export { value } from "../value.mjs";',
  };
  const stat = async (path) => ({ isFile: () => !path.endsWith("internal.mjs") });
  await expect(
    validateLibraryEntrypoints(
      {
        root: "/repo",
        packageJson: {
          main: "./src/index.mjs",
          exports: { ".": { import: "./src/index.mjs", types: "./src/index.d.ts" } },
        },
        repositoryInventory: inventory,
      },
      { stat },
    ),
  ).resolves.toEqual([
    "Library declaration must sit beside its same-basename .mjs file: ./src/internal.d.ts.",
    "src/internal.mjs is an internal pure export barrel.",
  ]);
});

test("uses defaults when no repository context is supplied", async () => {
  await expect(validateLibraryEntrypoints()).resolves.toEqual(
    expect.arrayContaining(["Libraries must declare a runtime main under src/."]),
  );
});
