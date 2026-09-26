import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findMonolithViolations } from "../../../../../src/checks/general/E-0.1/E-0.1.20/find-monolith-violations.mjs";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";

test("reports files over a configured line limit", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-monolith-violations-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "large.mjs"), "x\nx\nx");
  await expect(findMonolithViolations(root, "src", 2)).resolves.toEqual(["src/large.mjs (3 > 2)"]);
  await expect(findMonolithViolations(root, "src", 3)).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("uses shared file discovery and reads for monolith checks", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-monolith-inventory-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "large.mjs"), "x\nx\nx");
  const repositoryInventory = createRepositoryInventory(root);
  await expect(findMonolithViolations(root, "src", 2, repositoryInventory)).resolves.toEqual([
    "src/large.mjs (3 > 2)",
  ]);
  await rm(root, { recursive: true, force: true });
});
