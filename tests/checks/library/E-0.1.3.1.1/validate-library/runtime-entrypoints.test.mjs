import { expect, test, jest } from "@jest/globals";
import { validateLibraryRuntimeEntrypoints } from "../../../../../src/checks/library/E-0.1.3.1.1/validate-library/runtime-entrypoints.mjs";

test("validates a runtime main and each runtime export", async () => {
  const checkFile = jest.fn(async () => ({ isFile: () => true }));
  await expect(
    validateLibraryRuntimeEntrypoints(
      "/repo",
      { main: "./src/main.mjs", exports: { ".": "./src/index.mjs" } },
      ["./src/index.mjs", "./src/index.d.ts"],
      checkFile,
    ),
  ).resolves.toEqual([]);
  expect(checkFile).toHaveBeenCalledTimes(2);
});

test("reports missing runtime metadata and invalid runtime targets", async () => {
  const errors = await validateLibraryRuntimeEntrypoints(
    "/repo",
    { main: "./src/main.cjs", exports: { ".": "./src/index.cjs" } },
    ["./src/index.cjs"],
    async () => ({ isFile: () => true }),
  );

  expect(errors).toEqual([
    "Libraries must declare a runtime main under src/.",
    "package.json.exports must define runtime targets.",
    "Library runtime entrypoint must target a file under src/: ./src/main.cjs.",
    "Library runtime entrypoint must target a file under src/: ./src/index.cjs.",
  ]);
});
