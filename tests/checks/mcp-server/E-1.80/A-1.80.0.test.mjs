import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/mcp-server/E-1.80/A-1.80.0.mjs";

test("requires MCP guidance", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mcp-"));
  await writeFile(join(root, "AGENTS.md"), "mcp tools transport validation");
  await expect(run({ root })).resolves.toEqual({ ruleId: "A-1.80.0", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("reports incomplete guidance and missing files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mcp-"));
  await writeFile(join(root, "AGENTS.md"), "mcp tools transport");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.80.0",
    status: "fail",
    message: "MCP repositories must document MCP tools, transport, and validation in AGENTS.md.",
  });
  await rm(root, { recursive: true, force: true });
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.80.0",
    status: "fail",
    message: "MCP repositories require a root AGENTS.md file.",
  });
});
