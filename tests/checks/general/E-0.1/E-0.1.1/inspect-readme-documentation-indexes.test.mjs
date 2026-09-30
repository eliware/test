import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { inspectReadmeDocumentationIndexes } from "../../../../../src/checks/general/E-0.1/E-0.1.1/inspect-readme-documentation-indexes.mjs";

test.each(["application", "library"])(
  "requires the docs index for the %s profile and detects an examples surface",
  async (profile) => {
    const root = await mkdtemp(join(tmpdir(), "eliware-readme-indexes-"));
    await mkdir(join(root, "docs"));
    await mkdir(join(root, "specs"));
    await mkdir(join(root, "examples"));
    await writeFile(join(root, "docs", "README.md"), "docs");
    await writeFile(join(root, "specs", "README.md"), "specs");
    const packageJson = { eliware: { apply: [profile] } };
    await expect(inspectReadmeDocumentationIndexes(root, packageJson)).resolves.toEqual({
      docsRequired: true,
      examplesRequired: true,
      error:
        "README.md links to required documentation index examples/README.md, but it does not exist.",
    });
    await writeFile(join(root, "examples", "README.md"), "examples");
    await expect(inspectReadmeDocumentationIndexes(root, packageJson)).resolves.toEqual({
      docsRequired: true,
      examplesRequired: true,
      error: null,
    });
    await rm(join(root, "examples"), { recursive: true });
    await expect(inspectReadmeDocumentationIndexes(root)).resolves.toEqual({
      docsRequired: false,
      examplesRequired: false,
      error: null,
    });
    await rm(root, { recursive: true, force: true });
  },
);

test("reports every missing required index", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-readme-indexes-"));
  await expect(inspectReadmeDocumentationIndexes(root)).resolves.toEqual({
    docsRequired: false,
    examplesRequired: false,
    error:
      "README.md links to required documentation index specs/README.md, but it does not exist.",
  });
  await rm(root, { recursive: true, force: true });
});
