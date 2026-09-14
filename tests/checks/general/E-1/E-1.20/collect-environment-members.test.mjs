import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectEnvironmentMember } from "../../../../../src/checks/general/E-1/E-1.20/collect-environment-members.mjs";

test("collects direct and aliased member references", () => {
  const ast = parse("process.env.TOKEN; env.HOST;", { sourceType: "module" });
  const variables = new Set();
  const aliases = new Set(["env"]);
  for (const statement of ast.program.body) collectEnvironmentMember(statement.expression, aliases, variables);
  expect(variables).toEqual(new Set(["TOKEN", "HOST"]));
});

test("ignores unrelated AST nodes", () => {
  const ast = parse("const value = 1; foo.bar; other.foo; env[dynamic]; process.env[dynamic]; process.env.lower;", { sourceType: "module" });
  const variables = new Set();
  collectEnvironmentMember(null, new Set(), variables);
  collectEnvironmentMember(ast.program.body[0], new Set(), variables);
  collectEnvironmentMember(ast.program.body[1].expression, new Set(), variables);
  collectEnvironmentMember(ast.program.body[2].expression, new Set(), variables);
  collectEnvironmentMember(ast.program.body[3].expression, new Set(["env"]), variables);
  collectEnvironmentMember(ast.program.body[4].expression, new Set(), variables);
  collectEnvironmentMember(ast.program.body[5].expression, new Set(), variables);
  expect(variables).toEqual(new Set());
});
