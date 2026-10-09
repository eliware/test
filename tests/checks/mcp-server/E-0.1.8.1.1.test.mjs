import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/mcp-server/E-0.1.8.1.1.mjs";
import { createMcpToolFixture } from "../../../test-fixtures/mcp-server/E-0.1.8.1.1/tool-record-fixtures.mjs";

test("accepts matching MCP tool adapters and handlers", async () => {
  await expect(
    run({
      repositoryInventory: createMcpToolFixture({
        adapters: ["echo", "search"],
        handlers: ["echo", "search"],
      }),
    }),
  ).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("reports missing repository inventory", async () => {
  await expect(run()).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "MCP tool files could not be inspected.",
  });
});

test("reports inventory failures", async () => {
  await expect(
    run({
      repositoryInventory: {
        files: async () => {
          throw new Error("scan failed");
        },
        readText: async () => "",
      },
    }),
  ).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "MCP tool files could not be inspected: scan failed",
  });
});
test("reports tool contract failures", async () => {
  const inventory = createMcpToolFixture({ adapters: [], handlers: ["orphan"] });
  await expect(run({ repositoryInventory: inventory })).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("tools/orphan.mjs is required."),
  });
});
