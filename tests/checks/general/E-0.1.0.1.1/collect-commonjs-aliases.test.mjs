import { expect, test } from "@jest/globals";
import {
  collectCommonJsAliases,
  collectCommonJsExportAliases,
} from "../../../../src/checks/general/E-0.1.0.1.1/collect-commonjs-aliases.mjs";

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

test("collects destructured module exports aliases", () => {
  const tree = {
    type: "VariableDeclarator",
    id: {
      type: "ObjectPattern",
      properties: [{ key: { name: "exports" }, value: { name: "out" } }],
    },
    init: { type: "Identifier", name: "module" },
  };
  expect([...collectCommonJsAliases(tree, "module")]).toEqual(["module", "out"]);
  expect([...collectCommonJsAliases(tree, "exports")]).toEqual(["exports"]);
});

test("returns the source name when the tree has no aliases", () => {
  expect([...collectCommonJsAliases([], "exports")]).toEqual(["exports"]);
  expect([...collectCommonJsAliases(null, "module")]).toEqual(["module"]);
});

test("collects forwarded and destructured module export aliases", () => {
  const tree = {
    type: "Program",
    body: [
      {
        type: "VariableDeclarator",
        id: {
          type: "ObjectPattern",
          properties: [{ key: { name: "exports" }, value: { name: "out" } }],
        },
        init: { type: "Identifier", name: "module" },
      },
      {
        type: "VariableDeclarator",
        id: { type: "Identifier", name: "forwarded" },
        init: { type: "Identifier", name: "out" },
      },
      {
        type: "VariableDeclarator",
        id: { type: "Identifier", name: "direct" },
        init: {
          type: "MemberExpression",
          computed: true,
          object: { type: "Identifier", name: "module" },
          property: { type: "StringLiteral", value: "exports" },
        },
      },
    ],
  };
  expect([...collectCommonJsExportAliases(tree)]).toEqual(
    expect.arrayContaining(["exports", "out", "forwarded", "direct"]),
  );
});

test("handles computed and defaulted destructured export aliases", () => {
  const tree = {
    type: "VariableDeclarator",
    id: {
      type: "ObjectPattern",
      properties: [
        { key: { name: "other" }, value: { name: "unrelated" } },
        {
          key: { value: "exports" },
          value: { type: "AssignmentPattern", left: { name: "defaulted" } },
        },
      ],
    },
    init: { type: "Identifier", name: "module" },
  };
  expect([...collectCommonJsExportAliases(tree)]).toContain("defaulted");
});

test("handles absent destructuring properties", () => {
  const tree = {
    type: "VariableDeclarator",
    id: { type: "ObjectPattern", properties: null },
    init: { type: "Identifier", name: "module" },
  };
  expect([...collectCommonJsAliases(tree, "module")]).toEqual(["module"]);
  expect([...collectCommonJsExportAliases(tree)]).toEqual(["exports"]);
});
