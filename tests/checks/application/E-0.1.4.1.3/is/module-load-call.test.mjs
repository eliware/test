import { expect, test } from "@jest/globals";
import { isModuleLoadCall } from "../../../../../src/checks/application/E-0.1.4.1.3/is/module-load-call.mjs";

test("rejects AST nodes that are not calls or supported module loaders", () => {
  expect(isModuleLoadCall({ type: "ExpressionStatement" })).toBe(false);
  expect(isModuleLoadCall({ type: "CallExpression", callee: { name: "readFile" } })).toBe(false);
});
