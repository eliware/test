import { expect, test } from "@jest/globals";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateStandalonePrettierConfiguration } from "../../../../../src/checks/general/E-0.1.0.1.5/validate/standalone-prettier-configuration.mjs";

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
  const root = await mkdtemp(join(tmpdir(), "eliware-prettier-ignore-"));
  try {
    await mkdir(join(root, "nested", "deep"), { recursive: true });
    await writeFile(join(root, ".gitignore"), "*.mjs\n");
    await writeFile(join(root, "nested", "deep", "entry.mjs"), "export {};\n");
    await expect(
      validateStandalonePrettierConfiguration(
        {
          files: async () => [".gitignore", "nested/deep/entry.mjs"],
          readText: async () => "*.mjs\n",
        },
        root,
        async () => ({ stdout: Buffer.from("nested/deep/entry.mjs\0") }),
      ),
    ).resolves.toContain(".gitignore must not exclude maintained files: nested/deep/entry.mjs.");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not report maintained files that Prettier does not ignore", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-prettier-ignore-"));
  try {
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, ".gitignore"), "*.tmp\n");
    await writeFile(join(root, "src", "entry.mjs"), "export {};\n");
    await expect(
      validateStandalonePrettierConfiguration(
        {
          files: async () => [".gitignore", "src/entry.mjs"],
          readText: async () => "*.tmp\n",
        },
        root,
        async () => ({ stdout: Buffer.from("src/entry.mjs\0") }),
      ),
    ).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("allows an ignored, untracked YAML runtime file", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-prettier-ignore-"));
  try {
    await mkdir(join(root, "repos"), { recursive: true });
    await writeFile(join(root, ".gitignore"), "repos/targets.yaml\n");
    await writeFile(join(root, "repos", "targets.yaml"), "targets: []\n");
    await expect(
      validateStandalonePrettierConfiguration(
        {
          files: async () => [".gitignore", "repos/targets.yaml"],
          readText: async () => "repos/targets.yaml\n",
        },
        root,
        async () => ({ stdout: Buffer.alloc(0) }),
      ),
    ).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects a Git ignore rule for a tracked maintained YAML file", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-prettier-ignore-"));
  try {
    await mkdir(join(root, "specs"), { recursive: true });
    await writeFile(join(root, ".gitignore"), "specs/*.yaml\n");
    await writeFile(join(root, "specs", "rules.yaml"), "rules: []\n");
    await expect(
      validateStandalonePrettierConfiguration(
        {
          files: async () => [".gitignore", "specs/rules.yaml"],
          readText: async () => "specs/*.yaml\n",
        },
        root,
        async () => ({ stdout: Buffer.from("specs/rules.yaml\0") }),
      ),
    ).resolves.toContain(".gitignore must not exclude maintained files: specs/rules.yaml.");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
