import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import {
  staticStringValue,
  staticTemplateText,
} from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/static-template-text.mjs";

test("joins static template and concatenated string values", () => {
  const template = parse('const text = `start ${"middle"} end`;').program.body[0].declarations[0]
    .init;
  const concatenation = parse('const text = "left" + `right`;').program.body[0].declarations[0]
    .init;
  expect(staticTemplateText(template)).toBe("start middle end");
  expect(staticStringValue(concatenation)).toBe("leftright");
});

test("returns undefined for dynamic template values", () => {
  const template = parse("const text = `start ${value} end`;").program.body[0].declarations[0].init;
  expect(staticTemplateText(template)).toBeUndefined();
});
