import { collectShadowedJestNames } from "./collect-shadowed-jest-names.mjs";
import {
  isRegisteredJestSuiteCall,
  isRegisteredJestTestCall,
  isSkippedJestSuiteCall,
} from "./is-registered-jest-call.mjs";

export function hasRegisteredJestTest(program, bindings) {
  const {
    names,
    describeNames = new Set(["describe", "context"]),
    callbackNames,
    blockedTests,
    blockedCallbacks,
    blockedDescribes = new Set(),
  } = bindings;
  return containsTestCall(
    program,
    names,
    callbackNames,
    blockedTests,
    blockedCallbacks,
    describeNames,
    blockedDescribes,
  );
}

function containsTestCall(
  node,
  names,
  callbackNames,
  blockedTests,
  blockedCallbacks,
  describeNames,
  blockedDescribes,
  allowFunction = false,
) {
  if (Array.isArray(node))
    return node.some((item) =>
      containsTestCall(
        item,
        names,
        callbackNames,
        blockedTests,
        blockedCallbacks,
        describeNames,
        blockedDescribes,
      ),
    );
  if (!node || typeof node !== "object") return false;
  if (isFunction(node)) {
    if (!allowFunction) return false;
    const local = collectShadowedJestNames(node, names, callbackNames);
    return containsTestCall(
      node.body,
      names,
      callbackNames,
      new Set([...blockedTests, ...local.tests]),
      new Set([...blockedCallbacks, ...local.callbacks]),
      describeNames,
      new Set([...blockedDescribes, ...local.describes]),
    );
  }
  if (node.type === "CallExpression") {
    if (isRegisteredJestTestCall(node, names, callbackNames, blockedTests, blockedCallbacks))
      return true;
    if (isSkippedJestSuiteCall(node, describeNames)) return false;
    if (isRegisteredJestSuiteCall(node, describeNames, blockedDescribes, callbackNames)) {
      const callback = node.arguments[1];
      return containsTestCall(
        callback,
        names,
        callbackNames,
        blockedTests,
        blockedCallbacks,
        describeNames,
        blockedDescribes,
        true,
      );
    }
  }
  return Object.values(node).some((item) =>
    containsTestCall(
      item,
      names,
      callbackNames,
      blockedTests,
      blockedCallbacks,
      describeNames,
      blockedDescribes,
    ),
  );
}

function isFunction(node) {
  return ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(
    node?.type,
  );
}
