import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findLineLimitViolations } from "../../../../../src/checks/general/E-0.1/E-0.1.20/find-line-limit-violations.mjs";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";

test("reports files over a configured line limit", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-line-limit-violations-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "large.mjs"), "x\nx\nx");
  await expect(findLineLimitViolations(root, "src", 2)).resolves.toEqual(["src/large.mjs (3 > 2)"]);
  await expect(findLineLimitViolations(root, "src", 3)).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("uses shared file discovery and reads for line-limit checks", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-line-limit-inventory-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "large.mjs"), "x\nx\nx");
  const repositoryInventory = createRepositoryInventory(root);
  await expect(findLineLimitViolations(root, "src", 2, repositoryInventory)).resolves.toEqual([
    "src/large.mjs (3 > 2)",
  ]);
  await rm(root, { recursive: true, force: true });
});

test("discovers nested source files without recursive directory traversal", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-line-limit-nested-"));
  const nested = join(root, "src", ...Array.from({ length: 12 }, () => "nested"));
  await mkdir(nested, { recursive: true });
  await writeFile(join(nested, "deep.mjs"), "x\nx\nx");

  await expect(findLineLimitViolations(root, "src", 2)).resolves.toEqual([
    `src/${Array.from({ length: 12 }, () => "nested").join("/")}/deep.mjs (3 > 2)`,
  ]);
  await rm(root, { recursive: true, force: true });
});
