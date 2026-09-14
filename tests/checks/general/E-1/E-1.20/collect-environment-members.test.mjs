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
