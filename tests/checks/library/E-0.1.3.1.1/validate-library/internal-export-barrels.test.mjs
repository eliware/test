import { expect, test } from "@jest/globals";
import { validateLibraryInternalExportBarrels } from "../../../../../src/checks/library/E-0.1.3.1.1/validate-library/internal-export-barrels.mjs";

const readBarrel = async () => 'export { value } from "../value.mjs";';

test("accepts conditional and array library export targets", async () => {
  await expect(
    validateLibraryInternalExportBarrels(
      ["src/index.mjs", "src/nested/index.mjs", "src/private.mjs"],
      readBarrel,
      {
        main: "./src/index.mjs",
        exports: {
          ".": { import: ["./src/index.mjs"] },
          "./nested": ["./src/nested/index.mjs", "./src/private.mjs"],
          "./ignored": null,
        },
      },
      "repo",
    ),
  ).resolves.toEqual([]);
});

test("accepts declared non-index exports without a root subpath", async () => {
  await expect(
    validateLibraryInternalExportBarrels(
      ["src/entry.mjs"],
      readBarrel,
      { exports: { "./entry": { import: "./src/entry.mjs" } } },
      "repo",
    ),
  ).resolves.toEqual([]);
});

test("accepts a runtime module paired with a declaration export", async () => {
  await expect(
    validateLibraryInternalExportBarrels(
      ["src/entry.mjs"],
      readBarrel,
      { main: "./src/main.mjs", exports: "./src/entry.d.ts" },
      "repo",
    ),
  ).resolves.toEqual([]);
});

test("allows implementation beside a public library declaration target", async () => {
  await expect(
    validateLibraryInternalExportBarrels(
      ["src/index.mjs", "src/internal.mjs"],
      readBarrel,
      { main: "./src/index.mjs", types: "./src/index.d.ts" },
      "repo",
    ),
  ).resolves.toEqual(["src/internal.mjs is an internal pure export barrel."]);
});
