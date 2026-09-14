import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/application/E-1.130/E-1.130.2/A-1.130.2.0.mjs";

test("requires docs README to index end-user documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-docs-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "docs", "README.md"), "# Docs");
  await writeFile(join(root, "docs", "guide.md"), "# Guide");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("docs/guide.md") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("passes when the documentation tree is completely indexed", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-docs-indexed-"));
  await mkdir(join(root, "docs", "guides"), { recursive: true });
  await writeFile(
    join(root, "docs", "README.md"),
    "# Docs\n[Guide](docs/guide.md)\n[Deep guide](docs/guides/deep.md)\n",
  );
  await writeFile(join(root, "docs", "guide.md"), "# Guide");
  await writeFile(join(root, "docs", "guides", "deep.md"), "# Deep guide");
  await writeFile(join(root, "docs", "notes.txt"), "not documentation");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.130.2.0",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when the documentation tree cannot be read", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-docs-unavailable-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.130.2.0",
    status: "fail",
    message: "docs/README.md must index the complete end-user documentation tree.",
  });
  await rm(root, { recursive: true, force: true });
});
