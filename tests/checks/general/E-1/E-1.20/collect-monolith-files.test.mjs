import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectMonolithFiles, excludedFile } from "../../../../../src/checks/general/E-1/E-1.20/collect-monolith-files.mjs";

test("collects module files and excludes generated/artifact directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-monolith-files-"));
  await mkdir(join(root, "nested"));
  await mkdir(join(root, "generated"));
  await writeFile(join(root, "nested", "module.mjs"), "export {};");
  await writeFile(join(root, "generated", "ignored.mjs"), "export {};");
  expect(excludedFile("types.d.mts")).toBe(true);
  expect(await collectMonolithFiles(root)).toEqual([join(root, "nested", "module.mjs")]);
  await rm(root, { recursive: true, force: true });
});
