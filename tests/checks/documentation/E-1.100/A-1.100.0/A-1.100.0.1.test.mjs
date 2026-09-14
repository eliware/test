import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/documentation/E-1.100/A-1.100.0/A-1.100.0.1.mjs";

test("requires documentation boundaries in AGENTS.md", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-boundary-"));
  await writeFile(
    join(root, "AGENTS.md"),
    "documentation scope authority index link validation repository",
  );
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.100.0.1",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when AGENTS.md is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-boundary-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.100.0.1",
    status: "fail",
    message: "AGENTS.md is required before documentation boundaries can be reviewed.",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports missing documentation boundary terms", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-boundary-terms-"));
  await writeFile(join(root, "AGENTS.md"), "documentation scope");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.100.0.1",
    status: "fail",
    message:
      "AGENTS.md is missing documentation boundaries: authority, index, link, validation, repository.",
  });
  await rm(root, { recursive: true, force: true });
});
