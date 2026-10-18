import { expect, test } from "@jest/globals";
import { memberName } from "../../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/output/member-name.mjs";

test("reads named and computed string properties", () => {
  expect(memberName({ property: { name: "textContent" } })).toBe("textContent");
  expect(
    memberName({ computed: true, property: { type: "StringLiteral", value: "ariaLabel" } }),
  ).toBe("ariaLabel");
});

test("uses the property name when a computed key is not a string literal", () => {
  expect(memberName({ computed: true, property: { type: "Identifier", name: "key" } })).toBe("key");
});
