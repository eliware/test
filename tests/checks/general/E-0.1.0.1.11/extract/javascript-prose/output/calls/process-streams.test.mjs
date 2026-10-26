import { expect, test } from "@jest/globals";
import { isProcessOutputCall } from "../../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/calls/process-streams.mjs";

const call = (object, property) => ({
  type: "MemberExpression",
  object,
  property: { type: "Identifier", name: property },
  computed: false,
});
const identifier = (name) => ({ type: "Identifier", name });

test.each([
  [call(call(identifier("process"), "stdout"), "write"), true],
  [call(call(identifier("process"), "stderr"), "write"), true],
  [call(call(identifier("process"), "pid"), "write"), false],
  [call(call(identifier("process"), "stdout"), "read"), false],
])("classifies process stream output calls", (callee, expected) => {
  expect(isProcessOutputCall(callee)).toBe(expected);
});
