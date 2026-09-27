import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { traverseKnitBindingNode } from "../../../../../src/checks/general/E-0.1/E-0.1.10/traverse-knit-binding-node.mjs";

function walk(node, bindings, unsupported = []) {
  const visited = [];
  const visit = (child, scope) => {
    if (!child || typeof child !== "object") return;
    visited.push(child);
    if (traverseKnitBindingNode(child, scope, visit, unsupported)) return;
    for (const [key, value] of Object.entries(child)) {
      if (["loc", "start", "end"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach((nested) => visit(nested, scope));
      else if (value && typeof value === "object") visit(value, scope);
    }
  };
  const handled = traverseKnitBindingNode(node, bindings, visit, unsupported);
  return { handled, visited, unsupported };
}

test("scopes block declarations and invalidates mutated outer bindings", () => {
  const ast = parse('let value = "npm"; { const value = "curl"; value++; }', { sourceType: "module" }).program;
  const bindings = new Map([["value", "npm"]]);
  const result = walk(ast.body[1], bindings);
  expect(result.handled).toBe(true);
  expect(bindings.has("value")).toBe(true);
  expect(result.unsupported).toHaveLength(1);

  const outerMutation = parse('let command = "npm"; { command = "curl"; }', { sourceType: "module" }).program;
  const outerBindings = new Map([["command", "npm"]]);
  walk(outerMutation.body[1], outerBindings);
  expect(outerBindings.has("command")).toBe(false);

  const changedBindings = new Map([["value", "npm"]]);
  traverseKnitBindingNode(
    { type: "BlockStatement", body: [{ type: "ExpressionStatement" }] },
    changedBindings,
    (_statement, scope) => scope.set("value", "curl"),
    [],
  );
  expect(changedBindings.has("value")).toBe(false);

  const destructured = parse('const [value] = ["npm"];', { sourceType: "module" }).program.body[0];
  const block = { type: "BlockStatement", body: [destructured] };
  expect(walk(block, new Map()).handled).toBe(true);
});

test("propagates reassignment and preserves allowed process exit-code reporting", () => {
  const unsupported = [];
  const bindings = new Map([["command", "npm"]]);
  const reassignment = parse('command = "curl";', { sourceType: "module" }).program.body[0].expression;
  traverseKnitBindingNode(reassignment, bindings, () => {}, unsupported);
  expect(bindings.has("command")).toBe(false);
  const exitCode = parse("process.exitCode = 1;", { sourceType: "module" }).program.body[0].expression;
  traverseKnitBindingNode(exitCode, bindings, () => {}, unsupported);
  const memberMutation = parse("process.env.VALUE = 'changed';", { sourceType: "module" }).program.body[0].expression;
  traverseKnitBindingNode(memberMutation, bindings, () => {}, unsupported);
  expect(unsupported).toEqual([reassignment.start, memberMutation.start]);
});

test("visits statically expanded loops and rejects dynamic loops", () => {
  const bindings = new Map([["commands", ["npm", "node"]]]);
  const staticLoop = parse('for (const command of commands) { run(command); }', { sourceType: "module" }).program.body[0];
  const staticResult = walk(staticLoop, bindings);
  expect(staticResult.handled).toBe(true);
  expect(staticResult.visited.filter(({ type }) => type === "BlockStatement")).toHaveLength(2);

  const dynamicLoop = parse('for (const command of unknown) { run(command); }', { sourceType: "module" }).program.body[0];
  const dynamicResult = walk(dynamicLoop, new Map());
  expect(dynamicResult.handled).toBe(true);
  expect(dynamicResult.unsupported).toEqual([dynamicLoop.start]);

  const assignmentLoop = parse('for (command of ["npm"]) run(command);', { sourceType: "module" }).program.body[0];
  expect(walk(assignmentLoop, new Map()).handled).toBe(true);
});

test("adds only resolvable identifier declarations to static bindings", () => {
  const declarations = parse('const command = "npm"; const dynamic = unknown; const [destructured] = ["x"];', { sourceType: "module" }).program.body;
  const bindings = new Map();
  for (const declaration of declarations) traverseKnitBindingNode(declaration, bindings, () => {}, []);
  expect(bindings).toEqual(new Map([["command", "npm"]]));
});
