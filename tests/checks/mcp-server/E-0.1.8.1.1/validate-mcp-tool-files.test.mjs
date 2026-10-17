import { expect, test } from "@jest/globals";
import { validateMcpToolFiles } from "../../../../src/checks/mcp-server/E-0.1.8.1.1/validate-mcp-tool-files.mjs";
import { createMcpToolFixture } from "../../../../test-fixtures/mcp-server/E-0.1.8.1.1/tool-record-fixtures.mjs";

test("discovers matching adapters and handlers with arbitrary names", async () => {
  const inventory = createMcpToolFixture({
    adapters: ["echo", "query"],
    handlers: ["echo", "query"],
  });
  await expect(validateMcpToolFiles(inventory.fileList, inventory)).resolves.toEqual([]);
});

test("reports unmatched adapter and handler files", async () => {
  const inventory = createMcpToolFixture({ adapters: ["orphan"], handlers: ["missing"] });
  await expect(validateMcpToolFiles(inventory.fileList, inventory)).resolves.toEqual([
    "src/tools/orphan.mjs is required.",
    "tools/missing.mjs is required.",
    "src/tools/orphan.mjs could not be inspected: missing fixture: src/tools/orphan.mjs",
  ]);
});

test("rejects nested tool modules", async () => {
  const inventory = createMcpToolFixture();
  inventory.fileList.push("tools/nested/other.mjs", "src/tools/nested/other.mjs");
  await expect(validateMcpToolFiles(inventory.fileList, inventory)).resolves.toEqual([
    "tools/nested/other.mjs must be directly under tools/.",
    "src/tools/nested/other.mjs must be directly under src/tools/.",
  ]);
});

test("requires at least one tool adapter", async () => {
  const inventory = createMcpToolFixture({ adapters: [], handlers: [] });
  await expect(validateMcpToolFiles(inventory.fileList, inventory)).resolves.toEqual([
    "tools/ must contain at least one tool adapter.",
  ]);
});
