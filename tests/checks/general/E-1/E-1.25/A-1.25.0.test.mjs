import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-1/E-1.25/A-1.25.0.mjs";

test("requires indexed authority and directive specifications", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-specs-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "authority.json"), "{}");
  await writeFile(join(root, "specs", "directives.json"), "{}");
  await writeFile(join(root, "specs", "README.md"), "authority.json directives.json");
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});

test("rejects an unindexed specification", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-specs-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "authority.json"), "{}");
  await writeFile(join(root, "specs", "directives.json"), "{}");
  await writeFile(join(root, "specs", "README.md"), "authority.json");
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("fails closed when the specification directory is absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-specs-missing-"));
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});
