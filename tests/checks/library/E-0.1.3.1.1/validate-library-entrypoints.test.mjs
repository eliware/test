import { expect, test } from "@jest/globals";
import { validateLibraryEntrypoints } from "../../../../src/checks/library/E-0.1.3.1.1/validate-library-entrypoints.mjs";

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

test("rejects invalid metadata and non-file targets", async () => {
  const stat = async () => ({ isFile: () => false });
  await expect(validateLibraryEntrypoints({ packageJson: {} }, { stat })).resolves.toEqual(
    expect.arrayContaining([
      "Libraries must declare a runtime main under src/.",
      "Libraries must declare package.json.exports.",
      "package.json.exports must define runtime targets.",
    ]),
  );
  await expect(
    validateLibraryEntrypoints(
      { packageJson: { main: "./src/index.mjs", exports: "./src/index.mjs" } },
      { stat },
    ),
  ).resolves.toEqual(
    expect.arrayContaining(["Library runtime entrypoint target does not exist: ./src/index.mjs."]),
  );
});

test("checks declared and discovered declarations and internal barrels", async () => {
  const inventory = {
    files: async () => ["src/index.d.ts", "src/internal.d.ts", "src/internal.mjs"],
    readText: async () => 'export { value } from "./value.mjs";',
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

test("uses default arguments and rejects unsafe declaration paths", async () => {
  await expect(validateLibraryEntrypoints()).resolves.toEqual(
    expect.arrayContaining([
      "Libraries must declare a runtime main under src/.",
      "Library runtime entrypoint must target a file under src/: undefined.",
    ]),
  );
  await expect(
    validateLibraryEntrypoints(
      {
        packageJson: {
          main: "./src/index.mjs",
          exports: { ".": { import: "./src/index.mjs", types: "./src/../src/index.d.ts" } },
        },
      },
      { stat: async () => ({ isFile: () => true }) },
    ),
  ).resolves.toEqual([
    "Library declaration must target a file under src/: ./src/../src/index.d.ts.",
  ]);
});
