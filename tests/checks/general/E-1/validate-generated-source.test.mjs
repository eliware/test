import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findGeneratedSource } from "../../../../src/checks/general/E-1/validate-generated-source.mjs";

test("finds generated markers in source modules", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-generated-source-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "bundle.mjs"), "webpackJsonp([]);");
  await expect(findGeneratedSource(root, ["bundle.mjs"])).resolves.toEqual(["bundle.mjs"]);
  await rm(root, { recursive: true, force: true });
});

test("accepts ordinary source files and empty source collections", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-generated-source-clean-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "module.mjs"), "export const value = 1;\n");
  await expect(findGeneratedSource(root, ["module.mjs"])).resolves.toEqual([]);
  await expect(findGeneratedSource(root, [])).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});
