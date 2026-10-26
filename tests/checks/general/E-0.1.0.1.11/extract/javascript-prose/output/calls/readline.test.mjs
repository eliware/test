import { expect, test } from "@jest/globals";
import { isReadlineOutputCall } from "../../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/calls/readline.mjs";

const call = (object, property) => ({
  type: "MemberExpression",
  object: { type: "Identifier", name: object },
  property: { type: "Identifier", name: property },
  computed: false,
});

test.each([
  [call("readline", "question"), true],
  [call("readline", "close"), false],
  [call("prompt", "question"), false],
])("classifies readline output calls", (callee, expected) => {
  expect(isReadlineOutputCall(callee)).toBe(expected);
});
