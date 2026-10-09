import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/mcp-server/E-0.1.8.1.0.mjs";

test("requires MCP server profile sections", async () => {
  const headings = {
    "AGENTS.md": "## MCP server",
    "README.md": "## Tools\n## Resources\n## Prompts\n## Transport\n## Authentication\n## Schemas",
  };
  const repositoryInventory = { readText: async (path) => headings[path] };
  await expect(run({ repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("reports missing MCP server profile sections", async () => {
  const repositoryInventory = { readText: async () => "" };
  await expect(run({ repositoryInventory })).resolves.toMatchObject({ ruleId, status: "fail" });
});

test("uses default arguments and reports a missing inventory", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
});
