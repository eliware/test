import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import extractJavaScriptComments from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose/comments.mjs";
test("extracts comment text and source lines", () => {
  const ast = parse("// Choose an option.\nconst value = 1; /* Keep this value. */");
  expect(extractJavaScriptComments(ast.comments)).toEqual([
    { text: " Choose an option.", line: 1, kind: "prose" },
    { text: " Keep this value. ", line: 2, kind: "prose" },
  ]);
});
test("returns no blocks when the source has no comments", () => {
  expect(extractJavaScriptComments()).toEqual([]);
});
