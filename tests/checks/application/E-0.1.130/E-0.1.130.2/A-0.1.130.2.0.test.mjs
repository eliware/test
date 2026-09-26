import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/application/E-0.1.130/E-0.1.130.2/A-0.1.130.2.0.mjs";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";

test("requires docs README to index end-user documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-docs-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "docs", "README.md"), "# Docs\nPurpose and scope\nSetup and usage\nValidation and support\n");
  await writeFile(join(root, "docs", "guide.md"), "# Guide");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("docs/guide.md") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("fails when a required documentation section is absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-docs-section-"));
  await mkdir(join(root, "docs"), { recursive: true });
  await writeFile(join(root, "docs", "README.md"), "# Docs\nPurpose and scope\nSetup and usage\nValidation\n");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("support") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("passes when the documentation tree is completely indexed", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-docs-indexed-"));
  await mkdir(join(root, "docs", "guides"), { recursive: true });
  await writeFile(
    join(root, "docs", "README.md"),
    "# Docs\nPurpose and scope\nSetup and usage\nValidation and support\n[Guide](docs/guide.md)\n[Deep guide](docs/guides/deep.md)\n",
  );
  await writeFile(join(root, "docs", "guide.md"), "# Guide");
  await writeFile(join(root, "docs", "guides", "deep.md"), "# Deep guide");
  await writeFile(join(root, "docs", "notes.txt"), "not documentation");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-0.1.130.2.0",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when the documentation tree cannot be read", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-docs-unavailable-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-0.1.130.2.0",
    status: "fail",
    message: "docs/README.md must index the complete end-user documentation tree.",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when a nested markdown document is not indexed", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-docs-nested-"));
  await mkdir(join(root, "docs", "guides"), { recursive: true });
  await writeFile(
    join(root, "docs", "README.md"),
    "# Docs\nPurpose and scope\nSetup and usage\nValidation and support\n",
  );
  await writeFile(join(root, "docs", "guides", "deep.md"), "# Deep guide");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("docs/guides/deep.md") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("uses shared documentation discovery and text reads, including generated docs", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-docs-inventory-"));
  await mkdir(join(root, "docs", "dist"), { recursive: true });
  const index = "# Docs\nPurpose and scope\nSetup and usage\nValidation and support\n[Built guide](docs/dist/guide.md)\n";
  await writeFile(join(root, "docs", "README.md"), index);
  await writeFile(join(root, "docs", "dist", "guide.md"), "# Built guide");
  const reads = new Map();
  const directories = [];
  const repositoryInventory = createRepositoryInventory(root, {
    expandedDirectories: ["docs"],
    includeTestResultsUnder: ["docs"],
    readDirectory: async (directory, options) => {
      directories.push(directory);
      return readdir(directory, options);
    },
    read: async (path, encoding) => {
      reads.set(path, (reads.get(path) ?? 0) + 1);
      return readFile(path, encoding);
    },
  });
  await expect(run({ root, repositoryInventory })).resolves.toMatchObject({ status: "pass" });
  expect(reads.get(join(root, "docs", "README.md"))).toBe(1);
  expect(directories).toEqual([join(root, "docs"), join(root, "docs", "dist")]);
  await rm(root, { recursive: true, force: true });
});
