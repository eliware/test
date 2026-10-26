import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { prepareTestToolUse } from "../../../../../src/checks/application/E-0.1.4.1.3/analyze/prepare-test-tool-use.mjs";

test("prepares static strings and child-process launch aliases for traversal", () => {
  const program = parse(
    'import { spawn as launch } from "node:child_process"; const tool = "node";',
    { sourceType: "module" },
  ).program;
  const prepared = prepareTestToolUse(program);

  expect(prepared.strings.get("tool")).toBe("node");
  expect(prepared.launchNames).toContain("launch");
});
