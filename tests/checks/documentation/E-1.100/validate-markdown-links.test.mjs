import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateMarkdownLinks } from "../../../../src/checks/documentation/E-1.100/validate-markdown-links.mjs";

test("validates local Markdown links and fragments", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-markdown-links-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "docs", "index.md"), "# Heading");
  await writeFile(join(root, "README.md"), "[Docs](docs/index.md#heading)");
  await expect(validateMarkdownLinks(root, ["README.md", "docs/index.md"])).resolves.toBeNull();
  await writeFile(join(root, "README.md"), "[Docs][guide]\n[guide]: docs/index.md");
  await expect(validateMarkdownLinks(root, ["README.md"])).resolves.toBeNull();
  await writeFile(join(root, "README.md"), "[External](https://example.test)");
  await expect(validateMarkdownLinks(root, ["README.md"])).resolves.toBeNull();
  await writeFile(join(root, "README.md"), "[Missing heading](docs/index.md#missing)");
  await expect(validateMarkdownLinks(root, ["README.md"])).resolves.toContain("fragment");
  await writeFile(join(root, "README.md"), "[Missing](docs/nope.md)");
  await expect(validateMarkdownLinks(root, ["README.md"])).resolves.toContain("does not resolve");
  await rm(root, { recursive: true, force: true });
});
