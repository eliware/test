import { expect, test } from "@jest/globals";
import { validateLibraryEntrypointTarget } from "../../../../../src/checks/library/E-0.1.3.1.1/validate-library/entrypoint-target.mjs";

test("validates runtime targets and declaration targets with matching modules", async () => {
  const checkFile = async () => ({ isFile: () => true });
  await expect(
    validateLibraryEntrypointTarget("/repo", "./src/index.mjs", "runtime", checkFile),
  ).resolves.toEqual([]);
  await expect(
    validateLibraryEntrypointTarget("/repo", "./src/index.d.ts", "declaration", checkFile),
  ).resolves.toEqual([]);
});

test.each([
  "types/index.d.ts",
  "./src\\index.mjs",
  "./src/index?.mjs",
  "./src/[index].mjs",
  "./src/./index.mjs",
  "./src/index.cjs",
])("rejects unsafe or unsupported target %s", async (target) => {
  await expect(
    validateLibraryEntrypointTarget("/repo", target, "runtime", async () => ({
      isFile: () => true,
    })),
  ).resolves.toEqual([`Library runtime entrypoint must target a file under src/: ${target}.`]);
});

test("reports missing files and missing declaration companions", async () => {
  await expect(
    validateLibraryEntrypointTarget("/repo", "./src/missing.mjs", "runtime", async () => ({
      isFile: () => false,
    })),
  ).resolves.toEqual(["Library runtime entrypoint target does not exist: ./src/missing.mjs."]);
  await expect(
    validateLibraryEntrypointTarget("/repo", "./src/index.d.ts", "declaration", async (path) => ({
      isFile: () => !path.endsWith("index.mjs"),
    })),
  ).resolves.toEqual([
    "Library declaration must sit beside its same-basename .mjs file: ./src/index.d.ts.",
  ]);
});
