import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-0.1/E-0.1.0.mjs";

const agents = [
  "# AGENTS.md",
  "## Project",
  "## Scope and boundaries",
  "## Layout",
  "## Development",
  "## Validation",
  "## Security",
  "## Changes",
].join("\n");

async function fixture(content) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-0-"));
  if (content !== undefined) await writeFile(join(root, "AGENTS.md"), content);
  return root;
}

test("passes when AGENTS.md exists and contains the required sections", async () => {
  const root = await fixture(agents);
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-0.1.0", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("fails when AGENTS.md is missing", async () => {
  const root = await fixture();
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-0.1.0",
    status: "fail",
    message: "AGENTS.md is required at the repository root.",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when required AGENTS sections are missing", async () => {
  const root = await fixture("## Validation\n");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      ruleId: "E-0.1.0",
      status: "fail",
      message: expect.stringContaining("required sections"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});
