import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { jsonFiles, repositoryFiles } from "../../../../src/checks/documentation/E-1.100/collect-documentation-files.mjs";

test("collects documentation files while excluding generated directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-files-"));
  await mkdir(join(root, "docs"));
  await mkdir(join(root, "node_modules"));
  await writeFile(join(root, "docs", "index.md"), "# Docs");
  await writeFile(join(root, "docs", "data.json"), "{}");
  await writeFile(join(root, "node_modules", "ignored.json"), "{}");
  expect(jsonFiles(root)).toBe(jsonFiles(root));
  expect(repositoryFiles(root)).toBe(repositoryFiles(root));
  await expect(jsonFiles(root)).resolves.toEqual(["docs/data.json"]);
  await expect(repositoryFiles(root)).resolves.toEqual(["docs/data.json", "docs/index.md"]);
  await rm(root, { recursive: true, force: true });
});
