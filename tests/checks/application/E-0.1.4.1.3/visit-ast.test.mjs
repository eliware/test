import { expect, test } from "@jest/globals";
import { visitAst } from "../../../../src/checks/application/E-0.1.4.1.3/visit-ast.mjs";

test("visits nested nodes and stops when the callback matches", () => {
  const nodes = { type: "root", children: [{ type: "match" }] };
  const visited = [];
  expect(visitAst(nodes, (node) => (visited.push(node.type), node.type === "match"))).toBe(true);
  expect(visited).toEqual(["root", "match"]);
});

test("returns false when no node matches or the input is absent", () => {
  expect(visitAst({ children: [] }, () => false)).toBe(false);
  expect(visitAst(null, () => true)).toBe(false);
});
