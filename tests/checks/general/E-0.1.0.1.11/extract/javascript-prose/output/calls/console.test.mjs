import { expect, test } from "@jest/globals";
import { isConsoleOutputCall } from "../../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/calls/console.mjs";

const call = (object, property) => ({
  type: "MemberExpression",
  object: { type: "Identifier", name: object },
  property: { type: "Identifier", name: property },
  computed: false,
});

test.each([
  [call("console", "log"), true],
  [call("console", "table"), false],
  [call("client", "log"), false],
])("classifies console output calls", (callee, expected) => {
  expect(isConsoleOutputCall(callee)).toBe(expected);
});
