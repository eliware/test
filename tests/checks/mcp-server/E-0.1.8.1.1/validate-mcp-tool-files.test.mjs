import { expect, test } from "@jest/globals";
import { validateMcpToolFiles } from "../../../../src/checks/mcp-server/E-0.1.8.1.1/validate-mcp-tool-files.mjs";
import { createMcpToolFixture } from "../../../../test-fixtures/mcp-server/E-0.1.8.1.1/tool-record-fixtures.mjs";

test("accepts arbitrary matching tool adapter and handler names", async () => {
  const inventory = createMcpToolFixture({
    adapters: ["echo", "query"],
    handlers: ["echo", "query"],
  });
  await expect(validateMcpToolFiles(inventory.fileList, inventory)).resolves.toEqual([]);
});

test("requires one tool and reports unmatched adapter and handler files", async () => {
  const inventory = createMcpToolFixture({ adapters: ["orphan"], handlers: ["missing"] });
  inventory.contents.set("tools/orphan.mjs", "export { default } from '../src/tools/orphan.mjs';");
  await expect(validateMcpToolFiles(inventory.fileList, inventory)).resolves.toEqual([
    "src/tools/orphan.mjs is required.",
    "tools/missing.mjs is required.",
    "src/tools/orphan.mjs could not be inspected: missing fixture: src/tools/orphan.mjs",
  ]);
});

test("rejects an incorrect adapter path and a non-function tool handler", async () => {
  const inventory = createMcpToolFixture();
  inventory.contents.set("tools/echo.mjs", "export default function registerTool() {};");
  inventory.contents.set("src/tools/echo.mjs", "export default null;");
  await expect(validateMcpToolFiles(inventory.fileList, inventory)).resolves.toEqual([
    "tools/echo.mjs must re-export its matching source handler.",
    "src/tools/echo.mjs must default-export a function.",
  ]);
});

test("rejects an adapter with no default re-export", async () => {
  const inventory = createMcpToolFixture();
  inventory.contents.set("tools/echo.mjs", "export {};\n");
  await expect(validateMcpToolFiles(inventory.fileList, inventory)).resolves.toContain(
    "tools/echo.mjs must re-export its matching source handler.",
  );
});

test("reports syntax errors in adapters and handlers", async () => {
  const inventory = createMcpToolFixture();
  inventory.contents.set("tools/echo.mjs", "export {");
  inventory.contents.set("src/tools/echo.mjs", "export {");
  const errors = await validateMcpToolFiles(inventory.fileList, inventory);
  expect(errors).toHaveLength(2);
  expect(errors[0]).toMatch(/^tools\/echo\.mjs could not be inspected:/u);
  expect(errors[1]).toMatch(/^src\/tools\/echo\.mjs could not be inspected:/u);
});

test("ignores nested tool modules", async () => {
  const inventory = createMcpToolFixture();
  inventory.fileList.push("tools/nested/other.mjs", "src/tools/nested/other.mjs");
  await expect(validateMcpToolFiles(inventory.fileList, inventory)).resolves.toEqual([]);
});
