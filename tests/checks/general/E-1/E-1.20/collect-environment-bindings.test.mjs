import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectEnvironmentBindings } from "../../../../../src/checks/general/E-1/E-1.20/collect-environment-bindings.mjs";

test("collects aliases and uppercase destructured variables", () => {
  const ast = parse("const env = process.env; const { PORT } = process.env;", { sourceType: "module" });
  const aliases = new Set();
  const variables = new Set();
  for (const statement of ast.program.body) collectEnvironmentBindings(statement.declarations[0], aliases, variables);
  expect(aliases).toEqual(new Set(["env"]));
  expect(variables).toEqual(new Set(["PORT"]));
});
