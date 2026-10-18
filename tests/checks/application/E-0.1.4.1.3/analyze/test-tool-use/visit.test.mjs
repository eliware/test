import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { visitTestToolUse } from "../../../../../../src/checks/application/E-0.1.4.1.3/analyze/test-tool-use/visit.mjs";

test("uses caller-supplied aliases during command analysis", () => {
  const program = parse('launch("node", ["--test"]);', { sourceType: "unambiguous" }).program;
  expect(visitTestToolUse(program, new Map(), new Set(["launch"]), false)).toBe(true);
});
