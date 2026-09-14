import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.0.mjs";

const agents = ["eliware/docs", "eliware/conventions", "eliware/operations"].join("\n");

async function fixture(content) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-0-"));
  if (content !== undefined) await writeFile(join(root, "AGENTS.md"), content);
  return root;
}

test("passes when AGENTS.md exists and names the authority repositories", async () => {
  const root = await fixture(agents);
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.0", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("fails when AGENTS.md is missing", async () => {
  const root = await fixture();
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.0",
    status: "fail",
    message: "AGENTS.md is required at the repository root.",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when an authoritative repository is not referenced", async () => {
  const root = await fixture("eliware/docs\neliware/operations\n");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.0",
    status: "fail",
    message: "AGENTS.md must reference: eliware/conventions.",
  });
  await rm(root, { recursive: true, force: true });
});
