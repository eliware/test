import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.22/A-0.1.22.1.mjs";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";

const ignoreRules =
  "node_modules/\n.git/\ncoverage/\ndist/\nbuild/\n.cache/\n.env*\n.vscode/\n.idea/\n";
const readNoIgnoredPaths = async () => [];

test("checks the current repository Git index by default", async () => {
  await expect(run({ root: process.cwd() })).resolves.toEqual({
    ruleId: "A-0.1.22.1",
    status: "pass",
    message: "",
  });
});

test("checks required ignored paths from the on-disk .gitignore rules", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  try {
    await writeFile(join(root, ".gitignore"), ignoreRules);
    await expect(run({ root, readIgnoredPaths: readNoIgnoredPaths })).resolves.toEqual({
      ruleId: "A-0.1.22.1",
      status: "pass",
      message: "",
    });
    await writeFile(join(root, ".gitignore"), "node_modules/\n");
    await expect(run({ root, readIgnoredPaths: readNoIgnoredPaths })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("vcs state"),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses cached inventory text for the .gitignore file", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-inventory-"));
  try {
    const ignoreFile = join(root, ".gitignore");
    await writeFile(ignoreFile, ignoreRules);
    const reads = new Map();
    const repositoryInventory = createRepositoryInventory(root, {
      read: async (path, encoding) => {
        reads.set(path, (reads.get(path) ?? 0) + 1);
        return readFile(path, encoding);
      },
    });
    await expect(
      run({ root, repositoryInventory, readIgnoredPaths: readNoIgnoredPaths }),
    ).resolves.toMatchObject({ status: "pass" });
    expect(reads.get(ignoreFile)).toBe(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects files in the Git index that match ignore rules", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-disk-only-"));
  try {
    await writeFile(join(root, ".gitignore"), ignoreRules);
    await expect(
      run({
        root,
        readIgnoredPaths: async () => [".env.local", "dist/index.js"],
      }),
    ).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining(
        "Tracked or staged files match ignore rules: .env.local, dist/index.js",
      ),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fails when .gitignore is absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-"));
  try {
    await expect(run({ root, readIgnoredPaths: readNoIgnoredPaths })).resolves.toEqual({
      ruleId: "A-0.1.22.1",
      status: "fail",
      message: ".gitignore is required.",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports a required path that is explicitly ignored but re-included", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-negation-"));
  try {
    await writeFile(join(root, ".gitignore"), `${ignoreRules}!dist/index.js\n`);
    await expect(run({ root, readIgnoredPaths: readNoIgnoredPaths })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("build output"),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fails when the Git index cannot be inspected", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-gitignore-index-error-"));
  try {
    await writeFile(join(root, ".gitignore"), ignoreRules);
    await expect(run({ root, readIgnoredPaths: async () => null })).resolves.toEqual({
      ruleId: "A-0.1.22.1",
      status: "fail",
      message: "Git index inspection was unavailable; cannot verify ignored tracked files.",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
