import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectCommonJsFindings } from "../../../../../src/checks/general/E-1/E-1.20/commonjs-ast-analysis.mjs";

test("classifies CommonJS AST constructs", () => {
  const findings = [];
  collectCommonJsFindings(parse("module.exports = require('x');", { sourceType: "unambiguous" }).program, findings, "src/file.mjs");
  expect(findings).toEqual(expect.arrayContaining(["src/file.mjs: require()", "src/file.mjs: CommonJS export"]));
  collectCommonJsFindings(null, findings, "src/file.mjs");
});
