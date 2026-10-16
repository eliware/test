import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const getFileInfo = jest.fn();
const prettier = await import("prettier");

jest.unstable_mockModule("prettier", () => ({
  default: { ...prettier.default, getFileInfo },
}));

const { validateStandalonePrettierConfiguration } =
  await import("../../../../../src/checks/general/E-0.1.0.1.5/validate/standalone-prettier-configuration.mjs");

beforeEach(() => getFileInfo.mockReset());

test("accepts the package configuration without standalone files", async () => {
  await expect(
    validateStandalonePrettierConfiguration({ files: async () => ["src/index.mjs"] }),
  ).resolves.toEqual([]);
});

test("skips ignore checks when the inventory cannot read text", async () => {
  await expect(
    validateStandalonePrettierConfiguration({
      files: async () => [".gitignore", "src/index.mjs"],
    }),
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
      files: async () => [".gitignore", "src/index.mjs", "assets/image.png"],
      readText: async () => "src/**\n# comment\n",
    }),
  ).resolves.toEqual([".gitignore must not exclude maintained files: src/index.mjs."]);
});

test("supports ignore exceptions and ignores non-maintained files", async () => {
  await expect(
    validateStandalonePrettierConfiguration({
      files: async () => [".gitignore", "src/index.mjs", "assets/image.png"],
      readText: async () => "src/**\n!src/index.mjs\nassets/**",
    }),
  ).resolves.toEqual([]);
});

test("rejects .prettierignore files at every directory level", async () => {
  await expect(
    validateStandalonePrettierConfiguration({
      files: async () => [".prettierignore", "nested/.prettierignore"],
      readText: async () => "",
    }),
  ).resolves.toEqual([
    "Prettier ignore files are not allowed: .prettierignore, nested/.prettierignore.",
  ]);
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

test("uses Prettier ignore semantics for nested patterns", async () => {
  getFileInfo.mockResolvedValue({ ignored: true });

  await expect(
    validateStandalonePrettierConfiguration(
      {
        files: async () => [".gitignore", "nested/deep/entry.mjs"],
        readText: async () => "*.mjs\n",
      },
      "C:/repo",
      async () => ({ stdout: Buffer.from("nested/deep/entry.mjs\0") }),
    ),
  ).resolves.toContain(".gitignore must not exclude maintained files: nested/deep/entry.mjs.");
  expect(getFileInfo).toHaveBeenCalledWith(join("C:/repo", "nested", "deep", "entry.mjs"), {
    ignorePath: [join("C:/repo", ".gitignore")],
  });
});

test("does not report maintained files that Prettier does not ignore", async () => {
  getFileInfo.mockResolvedValue({ ignored: false });

  await expect(
    validateStandalonePrettierConfiguration(
      {
        files: async () => [".gitignore", "src/entry.mjs"],
        readText: async () => "*.tmp\n",
      },
      "C:/repo",
      async () => ({ stdout: Buffer.from("src/entry.mjs\0") }),
    ),
  ).resolves.toEqual([]);
});

test("allows an ignored, untracked YAML runtime file", async () => {
  await expect(
    validateStandalonePrettierConfiguration(
      {
        files: async () => [".gitignore", "repos/targets.yaml"],
        readText: async () => "repos/targets.yaml\n",
      },
      "C:/repo",
      async () => ({ stdout: Buffer.alloc(0) }),
    ),
  ).resolves.toEqual([]);
  expect(getFileInfo).not.toHaveBeenCalled();
});

test("rejects a Git ignore rule for a tracked maintained YAML file", async () => {
  getFileInfo.mockResolvedValue({ ignored: true });

  await expect(
    validateStandalonePrettierConfiguration(
      {
        files: async () => [".gitignore", "specs/rules.yaml"],
        readText: async () => "specs/*.yaml\n",
      },
      "C:/repo",
      async () => ({ stdout: Buffer.from("specs/rules.yaml\0") }),
    ),
  ).resolves.toContain(".gitignore must not exclude maintained files: specs/rules.yaml.");
});
