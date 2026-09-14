import { expect, test } from "@jest/globals";
import { hasIstanbulIgnoreDirective } from "../../../../../src/checks/general/E-1/E-1.5/read-istanbul-ignore.mjs";

test("detects Istanbul directives only in comments", () => {
  expect(hasIstanbulIgnoreDirective('const value = "istanbul ignore next";')).toBe(false);
  expect(hasIstanbulIgnoreDirective("// istanbul ignore next\nconst value = 1;")).toBe(true);
  expect(hasIstanbulIgnoreDirective("/* istanbul ignore file */\nexport {};")).toBe(true);
});

test("handles comment endings, escaped strings, and unterminated comments", () => {
  expect(hasIstanbulIgnoreDirective("// ordinary comment\rconst value = 1;")).toBe(false);
  expect(hasIstanbulIgnoreDirective("// ISTANBUL IGNORE NEXT\rconst value = 1;")).toBe(true);
  expect(hasIstanbulIgnoreDirective("/* ordinary block */ const value = 1;")).toBe(false);
  expect(hasIstanbulIgnoreDirective("/* istanbul ignore next")).toBe(true);
  expect(hasIstanbulIgnoreDirective("/* ordinary unterminated")).toBe(false);
  expect(hasIstanbulIgnoreDirective("`escaped \\` quote and // text`")).toBe(false);
  expect(hasIstanbulIgnoreDirective("'escaped \\' quote' / 2")).toBe(false);
  expect(hasIstanbulIgnoreDirective("value / other; value /* no directive */")).toBe(false);
  expect(hasIstanbulIgnoreDirective("")).toBe(false);
});
