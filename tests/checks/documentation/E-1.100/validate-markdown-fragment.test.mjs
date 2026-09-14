import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hasMarkdownFragment, markdownSlug } from "../../../../src/checks/documentation/E-1.100/validate-markdown-fragment.mjs";

test("matches heading and id fragments", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-markdown-fragment-"));
  const target = join(root, "index.md");
  await writeFile(target, "# Hello, World!\n<div id=\"custom\">x</div>\n");
  expect(markdownSlug("Hello, World!")).toBe("hello-world");
  await expect(hasMarkdownFragment(target, "hello-world")).resolves.toBe(true);
  await expect(hasMarkdownFragment(target, "custom")).resolves.toBe(true);
  await expect(hasMarkdownFragment(target, "missing")).resolves.toBe(false);
  await expect(hasMarkdownFragment(target, "")).resolves.toBe(true);
  await rm(root, { recursive: true, force: true });
});
