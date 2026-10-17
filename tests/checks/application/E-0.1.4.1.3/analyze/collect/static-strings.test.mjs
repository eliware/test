import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectStaticStrings } from "../../../../../../src/checks/application/E-0.1.4.1.3/analyze/collect/static-strings.mjs";

test("collects static declarations and assignments", () => {
  const { program } = parse('let runner; runner = "@jest/core"; const tool = runner;', {
    sourceType: "module",
  });
  expect(collectStaticStrings(program)).toEqual(
    new Map([
      ["runner", "@jest/core"],
      ["tool", "@jest/core"],
    ]),
  );
});

test("ignores dynamic and non-identifier assignments", () => {
  const { program } = parse('let runner; runner = dynamic; object.runner = "jest";', {
    sourceType: "module",
  });
  expect(collectStaticStrings(program)).toEqual(new Map());
});
