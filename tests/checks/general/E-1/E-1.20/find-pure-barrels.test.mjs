import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  findPureBarrels,
  isPureBarrelSource,
  sourceFiles,
} from "../../../../../src/checks/general/E-1/E-1.20/find-pure-barrels.mjs";

test("detects export-only modules and rejects implementation modules", () => {
  expect(isPureBarrelSource('export { value } from "./value.mjs";')).toBe(true);
  expect(isPureBarrelSource("const value = 1; export { value };")).toBe(false);
  expect(isPureBarrelSource('// export { fake };\nconst text = "import fake";')).toBe(false);
  expect(isPureBarrelSource('export {\n  value\n} from "./value.mjs";')).toBe(true);
  expect(isPureBarrelSource('import "./side-effect.mjs";')).toBe(false);
  expect(isPureBarrelSource('import { value } from "./value.mjs"; export { value };')).toBe(true);
  expect(isPureBarrelSource('"use strict"; export * from "./value.mjs";')).toBe(false);
  expect(isPureBarrelSource('import value from "./value.mjs"; export { value };')).toBe(true);
  expect(isPureBarrelSource("export const value = 1;")).toBe(false);
  expect(isPureBarrelSource("export {};")).toBe(false);
});

test("discovers nested pure barrels and excludes non-source directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-barrels-"));
  await mkdir(join(root, "src", "nested"), { recursive: true });
  await mkdir(join(root, "src", "node_modules"), { recursive: true });
  await mkdir(join(root, "src", "dist"), { recursive: true });
  await writeFile(join(root, "src", "index.mjs"), 'export * from "./value.mjs";\n');
  await writeFile(join(root, "src", "implementation.mjs"), "const value = 1;\n");
  await writeFile(join(root, "src", "nested", "entry.mjs"), 'export { value } from "../value.mjs";\n');
  await writeFile(join(root, "src", "nested", "notes.txt"), "not a module\n");
  await writeFile(join(root, "src", "node_modules", "ignored.mjs"), 'export * from "./value.mjs";\n');
  await writeFile(join(root, "src", "dist", "ignored.mjs"), 'export * from "./value.mjs";\n');
  await expect(findPureBarrels(root)).resolves.toEqual([
    "src/index.mjs",
    "src/nested/entry.mjs",
  ]);
  await rm(root, { recursive: true, force: true });
});

test("uses the default source directory reader", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-barrels-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "entry.mjs"), 'export * from "./value.mjs";\n');
  await expect(sourceFiles(join(root, "src"))).resolves.toHaveLength(1);
  await rm(root, { recursive: true, force: true });
});

test("returns no barrels when src is absent and propagates malformed source errors", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-barrels-"));
  await expect(findPureBarrels(root)).resolves.toEqual([]);
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "invalid.mjs"), "export {\n");
  await expect(findPureBarrels(root)).rejects.toBeTruthy();
  await rm(root, { recursive: true, force: true });
});

test("propagates non-missing source traversal errors", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-barrels-"));
  await writeFile(join(root, "src"), "not a directory\n");
  await expect(findPureBarrels(root)).rejects.toBeTruthy();
  await rm(root, { recursive: true, force: true });
});

test("propagates injected non-missing traversal errors", async () => {
  await expect(
    findPureBarrels("C:\\repo", async () => {
      const error = new Error("access denied");
      error.code = "EACCES";
      throw error;
    }),
  ).rejects.toThrow("access denied");
});
