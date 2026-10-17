import { expect, test } from "@jest/globals";
import { collectCommonJsAliases } from "../../../../../src/checks/general/E-0.1.0.1.1/collect-commonjs/aliases.mjs";

test("collects chained variable and assignment aliases", () => {
  const tree = {
    type: "Program",
    body: [
      {
        type: "VariableDeclarator",
        id: { name: "first" },
        init: { type: "Identifier", name: "require" },
      },
      {
        type: "AssignmentExpression",
        left: { name: "second" },
        right: { type: "Identifier", name: "first" },
      },
    ],
  };
  expect([...collectCommonJsAliases(tree, "require")]).toEqual(["require", "first", "second"]);
});

test("collects identifier aliases and returns the source when none exist", () => {
  const tree = {
    type: "VariableDeclarator",
    id: { name: "other" },
    init: { type: "Identifier", name: "module" },
  };
  expect([...collectCommonJsAliases(tree, "module")]).toEqual(["module", "other"]);
  expect([...collectCommonJsAliases([], "exports")]).toEqual(["exports"]);
  expect([...collectCommonJsAliases(null, "module")]).toEqual(["module"]);
});
