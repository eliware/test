import { expect, jest, test } from "@jest/globals";
import { visitCommonJsAst } from "../../../../../src/checks/general/E-0.1.0.1.1/collect-commonjs/visit-ast.mjs";

test("visits syntax nodes recursively and skips source location metadata", () => {
  const nodes = [];
  visitCommonJsAst(
    {
      type: "Program",
      loc: { type: "Location" },
      start: { type: "Start" },
      end: { type: "End" },
      body: [null, { type: "Identifier", name: "value" }],
      extra: { type: "Literal" },
      text: "ignored",
    },
    (node) => nodes.push(node.type),
  );

  expect(nodes).toEqual(["Program", "Identifier", "Literal"]);
});

test("ignores missing and primitive syntax nodes", () => {
  const visit = jest.fn();
  visitCommonJsAst(null, visit);
  visitCommonJsAst("text", visit);
  expect(visit).not.toHaveBeenCalled();
});
