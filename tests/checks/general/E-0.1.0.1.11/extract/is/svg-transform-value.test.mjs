import { expect, test } from "@jest/globals";
import { isSvgTransformValue } from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/is/svg-transform-value.mjs";

test("recognizes JSX transform attribute values", () => {
  expect(isSvgTransformValue({}, { type: "JSXAttribute", name: { name: "transform" } })).toBe(true);
});

test("recognizes the dynamic value passed to setAttribute transform", () => {
  const value = { type: "TemplateLiteral" };
  expect(
    isSvgTransformValue(value, {
      type: "CallExpression",
      callee: { property: { name: "setAttribute" } },
      arguments: [{ value: "transform" }, value],
    }),
  ).toBe(true);
});

test("does not recognize unrelated attributes or prose", () => {
  expect(isSvgTransformValue({}, { type: "JSXAttribute", name: { name: "className" } })).toBe(
    false,
  );
  expect(
    isSvgTransformValue({}, { type: "CallExpression", callee: { property: { name: "append" } } }),
  ).toBe(false);
});
