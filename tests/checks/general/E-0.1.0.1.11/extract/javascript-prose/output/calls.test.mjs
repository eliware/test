import { expect, test } from "@jest/globals";
import { isUserFacingOutputCall } from "../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/calls.mjs";

test.each([
  [member("window", "prompt"), true],
  [member("console", "log"), true],
  [member(member("process", "stdout"), "write"), true],
  [member("readline", "question"), true],
  [member("interaction", "reply"), true],
  [member("client", "query"), false],
  [{ type: "OptionalCallExpression" }, false],
  [{ ...member("console", "log"), computed: true, property: string("log") }, true],
])("classifies user-facing call %j", (callee, expected) => {
  expect(isUserFacingOutputCall(callee)).toBe(expected);
});

function member(object, property) {
  return {
    type: "MemberExpression",
    object: typeof object === "string" ? { type: "Identifier", name: object } : object,
    property: { type: "Identifier", name: property },
    computed: false,
  };
}

function string(value) {
  return { type: "StringLiteral", value };
}
