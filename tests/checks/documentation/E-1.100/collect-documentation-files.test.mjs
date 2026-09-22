import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectDocumentationFiles, jsonFiles, repositoryFiles } from "../../../../src/checks/documentation/E-1.100/collect-documentation-files.mjs";

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

test("bounds traversal depth and file count", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-limits-"));
  let deep = root;
  for (let index = 0; index < 34; index += 1) {
    deep = join(deep, `d${index}`);
    await mkdir(deep);
  }
  await writeFile(join(deep, "deep.md"), "# deep");
  await expect(collectDocumentationFiles(root, root, () => true, { maxDepth: 32 })).rejects.toThrow("depth limit");
  await rm(root, { recursive: true, force: true });
  const shallow = await mkdtemp(join(tmpdir(), "eliware-doc-file-limit-"));
  await writeFile(join(shallow, "one.md"), "# one");
  await expect(collectDocumentationFiles(shallow)).resolves.toEqual(["one.md"]);
  await expect(collectDocumentationFiles(shallow, shallow, () => true, { maxFiles: 0 })).rejects.toThrow("file limit");
  await rm(shallow, { recursive: true, force: true });
});

test("bounds cached repository roots", async () => {
  const roots = [];
  for (let index = 0; index < 33; index += 1) {
    const root = await mkdtemp(join(tmpdir(), `eliware-doc-cache-${index}-`));
    roots.push(root);
    await writeFile(join(root, "README.md"), "# Docs");
    await expect(repositoryFiles(root)).resolves.toEqual(["README.md"]);
  }
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
});
