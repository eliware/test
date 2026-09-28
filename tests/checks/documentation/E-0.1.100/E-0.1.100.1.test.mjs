import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/documentation/E-0.1.100/E-0.1.100.1.mjs";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";

test("requires linked documentation indexes", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-index-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "README.md"), "docs/README.md");
  await writeFile(join(root, "docs", "README.md"), "guide.md");
  await writeFile(join(root, "docs", "guide.md"), "guide");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-0.1.100.1",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when the documentation indexes are missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-index-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-0.1.100.1",
    status: "fail",
    message:
      "Root README.md is required for documentation indexing.\ndocs/README.md is required for documentation indexing.",
  });
  await rm(root, { recursive: true, force: true });
});

test("requires the root README to link the documentation index", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-index-root-link-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "README.md"), "documentation");
  await writeFile(join(root, "docs", "README.md"), "guide.md");
  await writeFile(join(root, "docs", "guide.md"), "guide");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-0.1.100.1",
    status: "fail",
    message: "Root README.md must link docs/README.md.",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports documentation files missing from the docs index", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-index-unlisted-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "README.md"), "documentation");
  await writeFile(join(root, "docs", "README.md"), "guide.md");
  await writeFile(join(root, "docs", "guide.md"), "guide");
  await writeFile(join(root, "docs", "reference.md"), "reference");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-0.1.100.1",
    status: "fail",
    message: "Root README.md must link docs/README.md.\ndocs/README.md must index: reference.md.",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports inventory traversal failures without skipping other index checks", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-index-inventory-error-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "README.md"), "no documentation index link");
  await writeFile(join(root, "docs", "README.md"), "guide.md");
  const repositoryInventory = {
    readText: (file) => readFile(file, "utf8"),
    documentationFiles: async () => {
      throw new Error("directory scan failed");
    },
  };
  try {
    await expect(run({ root, repositoryInventory })).resolves.toEqual({
      ruleId: "E-0.1.100.1",
      status: "fail",
      message:
        "Root README.md must link docs/README.md.\nDocumentation files could not be inspected: directory scan failed",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("indexes files under generated documentation subdirectories through the shared inventory", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-index-generated-"));
  await mkdir(join(root, "docs", "build"), { recursive: true });
  await writeFile(join(root, "README.md"), "docs/README.md");
  await writeFile(join(root, "docs", "README.md"), "build.md");
  await writeFile(join(root, "docs", "build", "build.md"), "generated documentation");
  const repositoryInventory = createRepositoryInventory(root, {
    expandedDirectories: ["docs"],
  });

  await expect(run({ root, repositoryInventory })).resolves.toEqual({
    ruleId: "E-0.1.100.1",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});
