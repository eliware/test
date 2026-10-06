import { expect, test } from "@jest/globals";
import { readStaticString } from "../../../../src/checks/application/E-0.1.4.1.3/read-static-string.mjs";

test("reads literal, template, and known identifier strings", () => {
  const strings = new Map([["name", "@jest/core"]]);
  expect(readStaticString({ type: "StringLiteral", value: "jest" })).toBe("jest");
  expect(
    readStaticString({
      type: "TemplateLiteral",
      expressions: [],
      quasis: [{ value: { cooked: "jest" } }],
    }),
  ).toBe("jest");
  expect(readStaticString({ type: "Identifier", name: "name" }, strings)).toBe("@jest/core");
});

test("folds string concatenation and rejects dynamic values", () => {
  const node = (left, right) => ({ type: "BinaryExpression", operator: "+", left, right });
  expect(
    readStaticString(
      node({ type: "StringLiteral", value: "@jest/" }, { type: "StringLiteral", value: "core" }),
    ),
  ).toBe("@jest/core");
  expect(
    readStaticString(
      node({ type: "StringLiteral", value: "@jest/" }, { type: "Identifier", name: "dynamic" }),
    ),
  ).toBeNull();
  expect(readStaticString({ type: "BinaryExpression", operator: "-" })).toBeNull();
  expect(readStaticString({ type: "Identifier", name: "missing" })).toBeNull();
  expect(readStaticString(null)).toBeNull();
});
