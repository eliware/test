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

test("reports nested adapters and handlers with their paths", async () => {
  const inventory = createMcpToolFixture({ adapters: ["echo"], handlers: ["echo"] });
  inventory.fileList.push("tools/nested/echo.mjs", "src/tools/nested/search.mjs");
  const result = await run({ repositoryInventory: inventory });
  expect(result).toMatchObject({ ruleId, status: "fail" });
  expect(result.message).toContain("tools/nested/echo.mjs must be directly under tools/.");
  expect(result.message).toContain(
    "src/tools/nested/search.mjs must be directly under src/tools/.",
  );
});

test("rejects a nested orphan beside a valid root-level pair", async () => {
  const inventory = createMcpToolFixture({ adapters: ["echo"], handlers: ["echo"] });
  inventory.fileList.push("tools/extra/orphan.mjs");
  await expect(run({ repositoryInventory: inventory })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("tools/extra/orphan.mjs must be directly under tools/"),
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
