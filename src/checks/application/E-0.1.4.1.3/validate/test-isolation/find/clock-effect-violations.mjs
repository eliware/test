import { visitAst } from "../visit-ast.mjs";

const timerNames = new Set(["setTimeout", "setInterval", "setImmediate"]);

export function findClockEffectViolations(ast) {
  const findings = [];
  let fakeTimers = false;
  visitAst(ast, (node) => {
    if (isFakeTimersCall(node)) fakeTimers = true;
  });
  visitAst(ast, (node) => {
    if (!fakeTimers && isTimerCall(node))
      findings.push("must use fake timers or inject a fixed clock for timer calls.");
    if (!fakeTimers && isUncontrolledDate(node))
      findings.push("must use fake timers or inject a fixed clock for date calls.");
  });
  return [...new Set(findings)];
}

function isFakeTimersCall(node) {
  return (
    node.type === "CallExpression" &&
    node.callee?.type === "MemberExpression" &&
    node.callee.object?.name === "jest" &&
    propertyName(node.callee) === "useFakeTimers"
  );
}

function isTimerCall(node) {
  return node.type === "CallExpression" && timerNames.has(node.callee?.name);
}

function isUncontrolledDate(node) {
  return (
    (node.type === "NewExpression" &&
      node.callee?.name === "Date" &&
      node.arguments.length === 0) ||
    (node.type === "CallExpression" &&
      node.callee?.type === "MemberExpression" &&
      node.callee.object?.name === "Date" &&
      propertyName(node.callee) === "now")
  );
}

function propertyName(member) {
  return member.computed ? member.property?.value : member.property?.name;
}
