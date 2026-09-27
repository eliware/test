import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";
import { runNoCoverageIgnore } from "../../../../src/checks/general/E-0.1/validate-no-coverage-ignore.mjs";
const run = (options) => runNoCoverageIgnore({ ruleId: "E-0.1.130.5", ...options });

test("rejects coverage-ignore directives outside pure barrels", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-ignore-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "clean.mjs"), "export const value = 1;\n");
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  await writeFile(
    join(root, "src", "unsafe.mjs"),
    "/* istanbul ignore next */\nexport const value = 1;\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
});

test("allows coverage-ignore directives in pure export barrels", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-barrel-ignore-"));
  await mkdir(join(root, "src"));
  await writeFile(
    join(root, "src", "barrel.mjs"),
    "/* istanbul ignore file */\nexport * from './value.mjs';\n",
  );
  await expect(
    run({
      root,
      packageJson: { eliware: { apply: ["library"] }, exports: { ".": "./src/barrel.mjs" } },
      findBarrels: async () => ["src/barrel.mjs"],
      isPureBarrel: () => true,
    }),
  ).resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});

test("rejects pure barrels that are not an exported public entrypoint", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-barrel-ignore-"));
  await mkdir(join(root, "src"));
  await writeFile(
    join(root, "src", "barrel.mjs"),
    "// istanbul ignore file\nexport * from './value.mjs';\n",
  );
  await expect(
    run({
      root,
      packageJson: { eliware: { apply: ["library"] }, exports: { ".": "./src/index.mjs" } },
    }),
  ).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("allows an application public entrypoint barrel but rejects an internal application barrel", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-app-barrel-ignore-"));
  await mkdir(join(root, "src"));
  await writeFile(
    join(root, "src", "index.mjs"),
    "// istanbul ignore file\nexport * from './value.mjs';\n",
  );
  await writeFile(join(root, "src", "internal.mjs"), "export * from './value.mjs';\n");
  await expect(
    run({
      root,
      packageJson: { eliware: { apply: ["application"] }, exports: { ".": "./src/index.mjs" } },
      findBarrels: async () => ["src/index.mjs"],
      isPureBarrel: () => true,
    }),
  ).resolves.toMatchObject({ status: "pass" });
  await writeFile(
    join(root, "src", "internal.mjs"),
    "// istanbul ignore file\nexport * from './value.mjs';\n",
  );
  await expect(
    run({
      root,
      packageJson: { eliware: { apply: ["application"] }, exports: { ".": "./src/index.mjs" } },
      findBarrels: async () => ["src/index.mjs", "src/internal.mjs"],
      isPureBarrel: () => true,
    }),
  ).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("rejects a public barrel whose source is not pure", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-barrel-nonpure-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "barrel.mjs"), "const value = 1;\nexport { value };\n");
  await expect(
    run({
      root,
      packageJson: { eliware: { apply: ["library"] }, exports: { ".": "./src/barrel.mjs" } },
      findBarrels: async () => ["src/barrel.mjs"],
      isPureBarrel: () => false,
    }),
  ).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("Pure-barrel classification changed"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("ignores text in strings but detects line and block comments", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-ignore-comments-"));
  await mkdir(join(root, "src"));
  await writeFile(
    join(root, "src", "strings.mjs"),
    'const text = "istanbul ignore next";\nexport { text };\n',
  );
  await expect(run({ root, packageJson: {} })).resolves.toMatchObject({ status: "pass" });
  await writeFile(
    join(root, "src", "comment.mjs"),
    "// istanbul ignore next\nexport const value = 1;\n",
  );
  await expect(run({ root, packageJson: {} })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("reports source discovery failures", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-ignore-error-"));
  await expect(run({ root, packageJson: {} })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await rm(root, { recursive: true, force: true });
});

test("uses the run-scoped source view and cached reads", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-ignore-inventory-"));
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "tests"), { recursive: true });
  await writeFile(join(root, "src", "clean.mjs"), "export const value = 1;\n");
  await writeFile(join(root, "src", "legacy.cts"), "module.exports = {};\n");
  await writeFile(join(root, "tests", "helper.mjs"), "export const testHelper = true;\n");
  const repositoryInventory = createRepositoryInventory(root, { includeTestResultsUnder: ["src"] });
  await expect(run({ root, packageJson: {}, repositoryInventory })).resolves.toMatchObject({
    status: "pass",
  });
  await rm(root, { recursive: true, force: true });
});
