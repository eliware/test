import { expect, test } from "@jest/globals";
const validatePrettierConfigurationFiles = (
  await import("../../../../../../src/checks/general/E-0.1.0.1.5/validate/prettier/configuration-files.mjs")
).default;
test("accepts the package configuration without standalone files", async () => {
  await expect(
    validatePrettierConfigurationFiles({
      files: async () => ["src/index.mjs"],
    }),
  ).resolves.toEqual([]);
});
test("rejects EditorConfig as a second formatting configuration", async () => {
  await expect(
    validatePrettierConfigurationFiles({
      files: async () => ["package.json", "nested/.editorconfig"],
    }),
  ).resolves.toEqual([
    "Standalone Prettier configuration files are not allowed: nested/.editorconfig.",
  ]);
});
test("skips file inspection when inventory is missing", async () => {
  await expect(validatePrettierConfigurationFiles()).resolves.toEqual([]);
});
test("reports inventory read errors", async () => {
  await expect(
    validatePrettierConfigurationFiles({
      files: async () => {
        throw new Error("denied");
      },
    }),
  ).resolves.toEqual(["Prettier configuration files could not be inspected: denied"]);
});
