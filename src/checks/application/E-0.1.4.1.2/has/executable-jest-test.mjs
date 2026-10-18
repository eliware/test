import { parse } from "@babel/parser";
import { collectJestTestNames } from "../collect/jest/names.mjs";
import { hasRegisteredJestTest } from "./registered-jest-test.mjs";
import { collectJestDescribeNames } from "../collect/jest/describe-names.mjs";
import { collectModuleShadowedNames } from "../collect/module-shadowed-jest-names.mjs";
import { collectJestCallbackNames } from "../collect/jest/callback-names.mjs";

export function inspectJestTestModule(content) {
  let ast;
  try {
    ast = parse(content, { sourceType: "module" });
  } catch {
    return { hasExecutableTest: false };
  }
  const testNames = collectJestTestNames(ast.program);
  const describeNames = collectJestDescribeNames(ast.program);
  const names = { ...testNames, describes: describeNames };
  const callbackNames = collectJestCallbackNames(ast.program);
  const moduleBindings = collectModuleShadowedNames(ast.program, names);
  return {
    hasExecutableTest: hasRegisteredJestTest(ast.program, {
      names,
      describeNames,
      callbackNames,
      blockedTests: moduleBindings.tests,
      blockedCallbacks: moduleBindings.callbacks,
      blockedDescribes: moduleBindings.describes,
    }),
  };
}
