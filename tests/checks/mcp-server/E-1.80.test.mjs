import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/mcp-server/E-1.80.mjs";

test("passes the MCP server profile root check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});
