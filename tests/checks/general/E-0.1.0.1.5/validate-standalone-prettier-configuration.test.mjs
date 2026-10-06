import { expect, test } from "@jest/globals";
import { validateStandalonePrettierConfiguration } from "../../../../src/checks/general/E-0.1.0.1.5/validate-standalone-prettier-configuration.mjs";

test("accepts the package configuration without standalone files", async () => {
  await expect(
    validateStandalonePrettierConfiguration({ files: async () => ["src/index.mjs"] }),
  ).resolves.toEqual([]);
});

test("rejects EditorConfig as a second formatting configuration", async () => {
  await expect(
    validateStandalonePrettierConfiguration({
      files: async () => ["package.json", "nested/.editorconfig"],
    }),
  ).resolves.toEqual([
    "Standalone Prettier configuration files are not allowed: nested/.editorconfig.",
  ]);
});

test("skips file inspection when inventory is missing", async () => {
  await expect(validateStandalonePrettierConfiguration()).resolves.toEqual([]);
});

test("reports inventory read errors", async () => {
  await expect(
    validateStandalonePrettierConfiguration({
      files: async () => {
        throw new Error("denied");
      },
    }),
  ).resolves.toEqual(["Prettier configuration files could not be inspected: denied"]);
});

test("rejects ignore patterns that exclude maintained files", async () => {
  await expect(
    validateStandalonePrettierConfiguration({
      files: async () => [".prettierignore", "src/index.mjs", "assets/image.png"],
      readText: async () => "src/**\n# comment\n",
    }),
  ).resolves.toEqual([".prettierignore must not exclude maintained files: src/index.mjs."]);
});

test("supports ignore exceptions and ignores non-maintained files", async () => {
  await expect(
    validateStandalonePrettierConfiguration({
      files: async () => [".prettierignore", "src/index.mjs", "assets/image.png"],
      readText: async () => "src/**\n!src/index.mjs\nassets/**",
    }),
  ).resolves.toEqual([]);
});

test("checks Git ignore rules and basename patterns", async () => {
  await expect(
    validateStandalonePrettierConfiguration({
      files: async () => [".gitignore", "src/index.mjs", "docs/guide.md"],
      readText: async () => "*.mjs\ndocs/",
    }),
  ).resolves.toEqual([
    ".gitignore must not exclude maintained files: src/index.mjs, docs/guide.md.",
  ]);
});
