import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/documentation/E-1.100/E-1.100.1.mjs";

test("requires linked documentation indexes", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-index-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "README.md"), "docs/README.md");
  await writeFile(join(root, "docs", "README.md"), "guide.md");
  await writeFile(join(root, "docs", "guide.md"), "guide");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.100.1",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when the documentation indexes are missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-index-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.100.1",
    status: "fail",
    message: "Documentation repositories require docs/README.md and a linked root index.",
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
    ruleId: "E-1.100.1",
    status: "fail",
    message: "Root README.md must link docs/README.md.",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports documentation files missing from the docs index", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-index-unlisted-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "README.md"), "docs/README.md");
  await writeFile(join(root, "docs", "README.md"), "guide.md");
  await writeFile(join(root, "docs", "guide.md"), "guide");
  await writeFile(join(root, "docs", "reference.md"), "reference");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.100.1",
    status: "fail",
    message: "docs/README.md must index: reference.md.",
  });
  await rm(root, { recursive: true, force: true });
});
