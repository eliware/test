import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  jsonFiles,
  repositoryFiles,
  validateMarkdownLinks,
} from "../../../../src/checks/documentation/E-1.100/documentation-surface.mjs";

test("discovers JSON files and resolves Markdown fragments", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-doc-surface-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "docs", "target.md"), "# Target Heading\n");
  await writeFile(join(root, "docs", "index.md"), "[target](target.md#target-heading)\n");
  await writeFile(join(root, "docs", "record.json"), "{}\n");
  expect(await jsonFiles(root)).toEqual(["docs/record.json"]);
  expect(await validateMarkdownLinks(root, ["docs/index.md", "docs/target.md"])).toBeNull();
  expect(await repositoryFiles(root)).toEqual(["docs/index.md", "docs/record.json", "docs/target.md"]);
  await rm(root, { recursive: true, force: true });
});

test("ignores excluded discovery directories and non-markdown files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-doc-discovery-"));
  for (const directory of [".git", "node_modules", "coverage", "build", "dist"]) {
    await mkdir(join(root, directory));
    await writeFile(join(root, directory, "ignored.json"), "{}");
  }
  await writeFile(join(root, "notes.txt"), "not a documentation surface");
  expect(await jsonFiles(root)).toEqual([]);
  expect(await repositoryFiles(root)).toEqual([]);
  expect(await validateMarkdownLinks(root, ["notes.txt"])).toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("accepts headings, HTML ids, fragments, definitions, and safe external links", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-doc-links-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "docs", "target.md"), '# Target *Heading*\n<h2 id="custom-id">Custom</h2>\n');
  await writeFile(join(root, "docs", "asset.txt"), "asset");
  await writeFile(
    join(root, "docs", "index.md"),
    [
      "[heading](target.md#target-heading)",
      "[custom](target.md#custom-id)",
      "[asset](asset.txt#ignored)",
      "[reference][target]",
      "[target]: target.md",
      "<target.md>",
      'href="target.md"',
      'src="asset.txt"',
      "[external](https://example.test)",
      "[mail](mailto:test@example.test)",
      "[anchor](#local)",
      '<a id="local"></a>',
      "<https://example.test>",
    ].join("\n"),
  );
  await expect(validateMarkdownLinks(root, ["docs/index.md"])).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("reports missing fragments and targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-doc-link-failures-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "docs", "target.md"), "# Existing\n");
  await writeFile(join(root, "docs", "fragment.md"), "[bad](target.md#missing)\n");
  await expect(validateMarkdownLinks(root, ["docs/fragment.md"])).resolves.toBe(
    "Documentation link fragment does not resolve: target.md#missing in docs/fragment.md.",
  );
  await writeFile(join(root, "docs", "missing.md"), "[bad](missing-target.md)\n");
  await expect(validateMarkdownLinks(root, ["docs/missing.md"])).resolves.toBe(
    "Documentation link does not resolve: missing-target.md in docs/missing.md.",
  );
  await writeFile(join(root, "docs", "escape.md"), "[outside](../../outside.md)\n");
  await expect(validateMarkdownLinks(root, ["docs/escape.md"])).resolves.toContain("escapes the repository");
  await rm(root, { recursive: true, force: true });
});
