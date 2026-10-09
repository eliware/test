import { parse } from "@babel/parser";
import { expect, test } from "@jest/globals";
import { collectJestDescribeNames } from "../../../../src/checks/application/E-0.1.4.1.2/collect-jest-describe-names.mjs";

test("collects Jest describe names and imported aliases", () => {
  const ast = parse('import { describe as suite } from "@jest/globals";', {
    sourceType: "module",
  });
  expect([...collectJestDescribeNames(ast.program)]).toEqual(["describe", "context", "suite"]);
});
