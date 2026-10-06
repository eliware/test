import { expect, test } from "@jest/globals";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findMarkdownFiles } from "../../../../src/checks/general/E-0.1.0.1.4/find-markdown-files.mjs";

test("finds Markdown files and skips generated folders", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-md-files-"));
  try {
    await mkdir(join(root, "docs"));
    await mkdir(join(root, "node_modules"));
    await writeFile(join(root, "README.md"), "root");
    await writeFile(join(root, "docs", "guide.MD"), "guide");
    await writeFile(join(root, "node_modules", "ignored.md"), "ignored");
    await writeFile(join(root, "notes.txt"), "notes");
    await expect(findMarkdownFiles(root)).resolves.toEqual(["README.md", "docs/guide.MD"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
