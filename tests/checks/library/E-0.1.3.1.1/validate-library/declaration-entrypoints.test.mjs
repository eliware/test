import { expect, test, jest } from "@jest/globals";
import { validateLibraryDeclarationEntrypoints } from "../../../../../src/checks/library/E-0.1.3.1.1/validate-library/declaration-entrypoints.mjs";

test("validates declared and discovered declarations once each", async () => {
  const checkFile = jest.fn(async () => ({ isFile: () => true }));
  await expect(
    validateLibraryDeclarationEntrypoints(
      "/repo",
      { types: "./src/index.d.ts", typings: "./src/legacy.d.ts" },
      ["./src/index.mjs", "./src/index.d.ts"],
      ["src/index.d.ts", "src/extra.d.ts", "docs/types.d.ts"],
      checkFile,
    ),
  ).resolves.toEqual([]);
  expect(checkFile).toHaveBeenCalledTimes(8);
});

test("reports declarations that do not target source files or lack companions", async () => {
  const errors = await validateLibraryDeclarationEntrypoints(
    "/repo",
    { types: "./types/index.d.ts" },
    ["./src/missing.d.ts"],
    [],
    async (path) => ({ isFile: () => !path.endsWith("missing.mjs") }),
  );

  expect(errors).toEqual([
    "Library declaration must target a file under src/: ./types/index.d.ts.",
    "Library declaration must sit beside its same-basename .mjs file: ./src/missing.d.ts.",
  ]);
});
test("accepts no declaration targets when no declarations are declared or discovered", async () => {
  await expect(
    validateLibraryDeclarationEntrypoints("/repo", {}, [], [], async () => ({
      isFile: () => true,
    })),
  ).resolves.toEqual([]);
});
