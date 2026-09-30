import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/documentation/E-0.1.100/E-0.1.100.1.mjs";

test("uses the root README and specifications index without requiring a docs directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-index-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "README.md"), "[specifications](specs/README.md)");
  await writeFile(join(root, "specs", "README.md"), "Structured records");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-0.1.100.1",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when the root README and specifications index are missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-index-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-0.1.100.1",
    status: "fail",
    message:
      "Root README.md is required for documentation indexing.\nspecs/README.md is required for structured documentation indexing.",
  });
  await rm(root, { recursive: true, force: true });
});

test("requires the root README to link the specifications index", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-index-root-link-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "README.md"), "documentation");
  await writeFile(join(root, "specs", "README.md"), "Structured records");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-0.1.100.1",
    status: "fail",
    message: "Root README.md must link specs/README.md.",
  });
  await rm(root, { recursive: true, force: true });
});
