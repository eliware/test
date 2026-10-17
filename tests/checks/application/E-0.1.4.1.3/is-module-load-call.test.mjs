import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { isModuleLoadCall } from "../../../../src/checks/application/E-0.1.4.1.3/is-module-load-call.mjs";

function call(source) {
  return parse(source, { sourceType: "module" }).program.body[0].expression;
}

test("recognizes supported require calls", () => {
  expect(isModuleLoadCall(call('require("./module.mjs");'))).toBe(true);
  expect(isModuleLoadCall(call('load("./module.mjs");'))).toBe(true);
  expect(isModuleLoadCall(call('module.require("./module.mjs");'))).toBe(true);
  expect(isModuleLoadCall(call('module["require"]("./module.mjs");'))).toBe(true);
});

test("rejects unrelated calls and non-call nodes", () => {
  expect(isModuleLoadCall(call('import("./module.mjs");'))).toBe(false);
  expect(isModuleLoadCall(call('readFile("./module.mjs");'))).toBe(false);
  expect(isModuleLoadCall(call('other.require("./module.mjs");'))).toBe(false);
  expect(isModuleLoadCall({ type: "ExpressionStatement" })).toBe(false);
});
