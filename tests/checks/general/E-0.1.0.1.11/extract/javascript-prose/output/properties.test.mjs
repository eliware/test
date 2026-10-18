import { expect, test } from "@jest/globals";
import { isUserFacingOutputProperty } from "../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/properties.mjs";

test.each([
  [member("element", "textContent"), true],
  [member("document", "title"), true],
  [{ ...member("element", "ariaLabel"), computed: true, property: string("ariaLabel") }, true],
  [member("element", "className"), false],
  [{ type: "Identifier", name: "textContent" }, false],
])("classifies displayed output property %j", (target, expected) => {
  expect(isUserFacingOutputProperty(target)).toBe(expected);
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
