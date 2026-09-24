import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { inspectReadmeDocumentationIndexes } from "../../../../../src/checks/general/E-1/E-1.1/inspect-readme-documentation-indexes.mjs";

test("requires docs and specs indexes and detects an examples surface", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-readme-indexes-"));
  await mkdir(join(root, "docs"));
  await mkdir(join(root, "specs"));
  await mkdir(join(root, "examples"));
  await writeFile(join(root, "docs", "README.md"), "docs");
  await writeFile(join(root, "specs", "README.md"), "specs");
  await expect(inspectReadmeDocumentationIndexes(root)).resolves.toEqual({
    examplesRequired: true,
    error: "README.md links to examples/README.md, but it does not exist.",
  });
  await writeFile(join(root, "examples", "README.md"), "examples");
  await expect(inspectReadmeDocumentationIndexes(root)).resolves.toEqual({
    examplesRequired: true,
    error: null,
  });
  await rm(join(root, "examples"), { recursive: true });
  await expect(inspectReadmeDocumentationIndexes(root)).resolves.toEqual({
    examplesRequired: false,
    error: null,
  });
  await rm(root, { recursive: true, force: true });
});

test("reports the first missing required index", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-readme-indexes-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "README.md"), "specs");
  await expect(inspectReadmeDocumentationIndexes(root)).resolves.toEqual({
    examplesRequired: false,
    error: "README.md links to required documentation index docs/README.md, but it does not exist.",
  });
  await rm(root, { recursive: true, force: true });
});
