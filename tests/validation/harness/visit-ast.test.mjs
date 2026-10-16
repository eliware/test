import { expect, jest, test } from "@jest/globals";
import { visitAst } from "../../../src/validation/harness/visit-ast.mjs";

test("visits object nodes and skips non-object values", () => {
  const visited = [];
  visitAst({ child: { name: "child" }, values: [null, 1, "text"] }, (node) => visited.push(node));
  expect(visited).toHaveLength(2);
});

test("skips a missing node", () => {
  const callback = jest.fn();
  visitAst(null, callback);
  expect(callback).not.toHaveBeenCalled();
});
