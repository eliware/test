import { expect, test } from "@jest/globals";
import { collectBindingNames } from "../../../../src/checks/application/E-0.1.4.1.2/collect-binding-names.mjs";

test("collects names from identifiers and nested binding patterns", () => {
  expect(collectBindingNames({ type: "Identifier", name: "value" })).toEqual(["value"]);
  expect(
    collectBindingNames({
      type: "ObjectPattern",
      properties: [
        { type: "ObjectProperty", value: { type: "Identifier", name: "first" } },
        { type: "RestElement", argument: { type: "Identifier", name: "rest" } },
      ],
    }),
  ).toEqual(["first", "rest"]);
  expect(
    collectBindingNames({
      type: "ArrayPattern",
      properties: [{ type: "AssignmentPattern", left: { type: "Identifier", name: "second" } }],
    }),
  ).toEqual(["second"]);
});

test("ignores unsupported binding forms", () => {
  expect(collectBindingNames({ type: "ThisExpression" })).toEqual([]);
  expect(
    collectBindingNames({ type: "RestElement", argument: { type: "Identifier", name: "rest" } }),
  ).toEqual(["rest"]);
  expect(collectBindingNames({ type: "ObjectPattern" })).toEqual([]);
});
