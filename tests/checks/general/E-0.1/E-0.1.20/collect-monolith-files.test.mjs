import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  collectMonolithFiles,
  excludedFile,
} from "../../../../../src/checks/general/E-0.1/E-0.1.20/collect-monolith-files.mjs";

test("collects module files and excludes generated/artifact directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-monolith-files-"));
  await mkdir(join(root, "nested"));
  await mkdir(join(root, "generated"));
  await writeFile(join(root, "nested", "module.mjs"), "export {};");
  await writeFile(join(root, "generated", "ignored.mjs"), "export {};");
  await writeFile(join(root, "nested", "component.snap.mjs"), "export {};");
  await writeFile(join(root, "nested", "bundle.generated.mjs"), "export {};");
  expect(excludedFile("types.d.mts")).toBe(true);
  expect(await collectMonolithFiles(root)).toEqual([join(root, "nested", "module.mjs")]);
  await rm(root, { recursive: true, force: true });
});

test("uses scoped inventory discovery for one monolith subtree", async () => {
  const root = "C:/fixture";
  const inventory = {
    root,
    entriesUnder: jest.fn(async () => [
      { path: "src/nested", type: "directory" },
      { path: "src/module.mjs", type: "file" },
      { path: "src/nested/module.mjs", type: "file" },
      { path: "src/generated/output.mjs", type: "file" },
      { path: "src/types.d.mts", type: "file" },
      { path: "src/component.snap.mjs", type: "file" },
      { path: "src/bundle.generated.mjs", type: "file" },
    ]),
    files: jest.fn(),
  };
  await expect(collectMonolithFiles(join(root, "src"), inventory)).resolves.toEqual([
    join(root, "src/module.mjs"),
    join(root, "src/nested/module.mjs"),
  ]);
  expect(inventory.entriesUnder).toHaveBeenCalledWith(join(root, "src"), expect.any(Function));
  const fileFilter = inventory.entriesUnder.mock.calls[0][1];
  expect(fileFilter("src/module.mjs")).toBe(true);
  expect(fileFilter("src/generated/output.mjs")).toBe(false);
  expect(fileFilter("src/module.ts")).toBe(false);
  expect(inventory.files).not.toHaveBeenCalled();
});
