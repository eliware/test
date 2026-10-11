import { collectShadowedJestNames } from "./collect-shadowed-jest-names.mjs";
import { collectBlockShadowedJestNames } from "./collect-block-shadowed-jest-names.mjs";
import {
  isRegisteredJestSuiteCall,
  isRegisteredJestTestCall,
  isSkippedJestSuiteCall,
} from "./is-registered-jest-call.mjs";

export function findRegisteredJestTest(program, bindings) {
  const state = {
    ...bindings,
    describeNames: bindings.describeNames ?? new Set(["describe", "context"]),
    blockedDescribes: bindings.blockedDescribes ?? new Set(),
  };
  return visit(program, state);
}

function visit(node, state, allowFunction = false) {
  if (Array.isArray(node)) return node.some((item) => visit(item, state));
  if (!node || typeof node !== "object") return false;
  if (node.type === "BlockStatement")
    return visit(
      node.body,
      extendState(state, collectBlockShadowedJestNames(node, state.names, state.callbackNames)),
    );
  if (isFunction(node)) {
    if (!allowFunction) return false;
    return visit(
      node.body,
      extendState(state, collectShadowedJestNames(node, state.names, state.callbackNames)),
    );
  }
  if (node.type === "CallExpression") {
    if (
      isRegisteredJestTestCall(
        node,
        state.names,
        state.callbackNames,
        state.blockedTests,
        state.blockedCallbacks,
      )
    )
      // codescope ignore this because the validator needs only one proven registered test.
      return true;
    if (isSkippedJestSuiteCall(node, state.describeNames)) return false;
    if (
      isRegisteredJestSuiteCall(
        node,
        state.describeNames,
        state.blockedDescribes,
        state.callbackNames,
      )
    )
      return visit(node.arguments[1], state, true);
  }
  return Object.values(node).some((item) => visit(item, state));
}

function extendState(state, shadowed) {
  return {
    ...state,
    blockedTests: new Set([...state.blockedTests, ...shadowed.tests]),
    blockedCallbacks: new Set([...state.blockedCallbacks, ...shadowed.callbacks]),
    blockedDescribes: new Set([...state.blockedDescribes, ...shadowed.describes]),
  };
}

function isFunction(node) {
  return ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(
    node?.type,
  );
}
