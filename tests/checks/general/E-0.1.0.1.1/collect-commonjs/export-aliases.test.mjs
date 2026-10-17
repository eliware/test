import { expect, test } from "@jest/globals";
import { collectCommonJsExportAliases } from "../../../../../src/checks/general/E-0.1.0.1.1/collect-commonjs/export-aliases.mjs";

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

test("handles computed defaulted export aliases and missing properties", () => {
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
  expect([...collectCommonJsExportAliases({ ...tree, id: { type: "ObjectPattern" } })]).toEqual([
    "exports",
  ]);
});
