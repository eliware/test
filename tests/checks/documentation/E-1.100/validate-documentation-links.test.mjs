import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { validateDocumentationLinks } from "../../../../src/checks/documentation/E-1.100/validate-documentation-links.mjs";

test("delegates repository documentation link validation", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-links-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "README.md"), "[Docs](docs/index.md)");
  await writeFile(join(root, "docs", "index.md"), "# Docs");
  await expect(validateDocumentationLinks(root)).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});
