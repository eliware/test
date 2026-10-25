import { expect, test } from "@jest/globals";
import { collectBindingNames } from "../../../../../src/checks/application/E-0.1.4.1.2/collect/binding-names.mjs";

test("collects names from identifiers and nested binding patterns", () => {
  expect(collectBindingNames({ type: "Identifier", name: "value" })).toEqual(["value"]);
  expect(
    collectBindingNames({
      type: "ObjectPattern",
      properties: [
        { type: "ObjectProperty", value: { type: "Identifier", name: "first" } },
        { type: "Identifier", name: "fourth" },
        { type: "RestElement", argument: { type: "Identifier", name: "rest" } },
      ],
    }),
  ).toEqual(["first", "fourth", "rest"]);
  expect(
    collectBindingNames({
      type: "ArrayPattern",
      elements: [
        { type: "AssignmentPattern", left: { type: "Identifier", name: "second" } },
        null,
        { type: "Identifier", name: "third" },
      ],
    }),
  ).toEqual(["second", "third"]);
});

test("ignores unsupported binding forms", () => {
  expect(collectBindingNames({ type: "ThisExpression" })).toEqual([]);
  expect(collectBindingNames({ type: "ArrayPattern" })).toEqual([]);
  expect(
    collectBindingNames({ type: "RestElement", argument: { type: "Identifier", name: "rest" } }),
  ).toEqual(["rest"]);
  expect(collectBindingNames({ type: "ObjectPattern" })).toEqual([]);
});
