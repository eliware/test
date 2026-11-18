import { expect, test } from "@jest/globals";
import collectCommonJsAliases from "../../../../../src/checks/general/E-0.1.0.1.1/collect-commonjs/aliases.mjs";
test("collects chained require, module, and exports aliases in one traversal", () => {
  const tree = {
    type: "Program",
    body: [
      {
        type: "VariableDeclarator",
        id: { name: "load" },
        init: { type: "Identifier", name: "require" },
      },
      {
        type: "VariableDeclarator",
        id: { name: "mod" },
        init: { type: "Identifier", name: "module" },
      },
      {
        type: "VariableDeclarator",
        id: { name: "out" },
        init: {
          type: "MemberExpression",
          computed: true,
          object: { type: "Identifier", name: "mod" },
          property: { type: "StringLiteral", value: "exports" },
        },
      },
      {
        type: "VariableDeclarator",
        id: {
          type: "ObjectPattern",
          properties: [
            {
              key: { value: "exports" },
              value: { type: "AssignmentPattern", left: { name: "destructured" } },
            },
          ],
        },
        init: { type: "Identifier", name: "mod" },
      },
      {
        type: "VariableDeclarator",
        id: { type: "ObjectPattern" },
        init: { type: "Identifier", name: "mod" },
      },
      {
        type: "VariableDeclarator",
        id: { name: "forwarded" },
        init: { type: "Identifier", name: "destructured" },
      },
    ],
  };
  const aliases = collectCommonJsAliases(tree);
  expect([...aliases.require]).toEqual(["require", "load"]);
  expect([...aliases.module]).toEqual(["module", "mod"]);
  expect([...aliases.exports]).toEqual(
    expect.arrayContaining(["exports", "out", "destructured", "forwarded"]),
  );
});
test("returns the built-in aliases when the tree contains no alias declarations", () => {
  expect(collectCommonJsAliases(null)).toEqual({
    require: new Set(["require"]),
    module: new Set(["module"]),
    exports: new Set(["exports"]),
  });
});
