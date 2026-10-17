import { expect, jest, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectHoistedVarNames } from "../../../../../src/checks/application/E-0.1.4.1.2/collect/hoisted-var-names.mjs";

test("collects var bindings across blocks and skips nested function and class scopes", () => {
  const program = parse(
    "var test; { var it; let describe; function nested() { var test; } } class Hidden { method() { var test; } }",
    { sourceType: "module" },
  ).program;
  const names = [];

  for (const node of program.body) collectHoistedVarNames(node, (name) => names.push(name));

  expect(names).toEqual(["test", "it"]);
});

test("passes initializers to the binding callback", () => {
  const program = parse("var test = callback;", { sourceType: "module" }).program;
  const add = jest.fn();

  collectHoistedVarNames(program.body[0], add);

  expect(add).toHaveBeenCalledWith("test", program.body[0].declarations[0].init);
});

test("ignores non-variable declarations and missing nodes", () => {
  const add = jest.fn();

  collectHoistedVarNames(null, add);
  collectHoistedVarNames({ type: "VariableDeclaration", kind: "let", declarations: [] }, add);

  expect(add).not.toHaveBeenCalled();
});
