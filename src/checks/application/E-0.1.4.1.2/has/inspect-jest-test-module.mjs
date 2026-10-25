import { collectJestTestNames } from "../collect/jest/test-bindings.mjs";
import { hasRegisteredJestTest } from "./registered-jest-test.mjs";
import { collectJestDescribeNames } from "../collect/jest/describe-names.mjs";
import { collectModuleShadowedNames } from "../collect/module-shadowed-jest-names.mjs";
import { collectJestCallbackNames } from "../collect/jest/callback-names.mjs";

export function inspectJestTestModule(program) {
  const testNames = collectJestTestNames(program);
  const describeNames = collectJestDescribeNames(program);
  const names = { ...testNames, describes: describeNames };
  const callbackNames = collectJestCallbackNames(program);
  const moduleBindings = collectModuleShadowedNames(program, names);
  return {
    hasExecutableTest: hasRegisteredJestTest(program, {
      names,
      describeNames,
      callbackNames,
      blockedTests: moduleBindings.tests,
      blockedCallbacks: moduleBindings.callbacks,
      blockedDescribes: moduleBindings.describes,
    }),
  };
}
