import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.25/A-0.1.25.0.mjs";

test("requires an indexed directive specification", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-specs-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "directives.json"), "{}");
  await writeFile(join(root, "specs", "README.md"), "directives.json");
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});

test("uses the shared repository inventory when available", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-specs-inventory-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "directives.json"), "{}");
  await writeFile(join(root, "specs", "README.md"), "directives.json");
  const repositoryInventory = {
    entriesUnder: async () => [{ path: "specs/directives.json", type: "file" }],
  };
  await expect(run({ root, repositoryInventory })).resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});

test("rejects an unindexed specification", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-specs-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "directives.json"), "{}");
  await writeFile(join(root, "specs", "README.md"), "");
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("rejects an unindexed structured specification under a subdirectory", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-specs-nested-"));
  await mkdir(join(root, "specs", "conventions"), { recursive: true });
  await writeFile(join(root, "specs", "directives.json"), "{}");
  await writeFile(join(root, "specs", "conventions", "general.json"), "{}");
  await writeFile(join(root, "specs", "README.md"), "directives.json");
  const result = await run({ root });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("specs/README.md must link conventions/general.json.");
  await rm(root, { recursive: true, force: true });
});

test("fails when the index is absent but specifications exist", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-specs-index-missing-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "directives.json"), "{}");
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("reports all missing specification files and index", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-specs-multiple-missing-"));
  await mkdir(join(root, "specs"));
  const result = await run({ root });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("specs/README.md");
  expect(result.message).toContain("specs/directives.json");
  await rm(root, { recursive: true, force: true });
});

test("reports a missing specification directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-specs-directory-missing-"));
  const result = await run({ root });
  expect(result.message).toContain("specs/README.md");
  expect(result.message).toContain("specs/directives.json");
  await rm(root, { recursive: true, force: true });
});
