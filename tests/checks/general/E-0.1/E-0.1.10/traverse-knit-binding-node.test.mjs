import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { traverseKnitBindingNode } from "../../../../../src/checks/general/E-0.1/E-0.1.10/traverse-knit-binding-node.mjs";

function walk(node, bindings, visited = []) {
  const visit = (child, scope) => {
    if (!child || typeof child !== "object") return;
    visited.push(child);
    if (traverseKnitBindingNode(child, scope, visit)) return;
    for (const [key, value] of Object.entries(child)) {
      if (["loc", "start", "end"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach((nested) => visit(nested, scope));
      else if (value && typeof value === "object") visit(value, scope);
    }
  };
  const handled = traverseKnitBindingNode(node, bindings, visit);
  return { handled, visited };
}

test("isolates block bindings and invalidates reassigned outer bindings", () => {
  const block = parse('let value = "npm"; { const value = "curl"; value++; }', {
    sourceType: "module",
  }).program.body[1];
  const bindings = new Map([["value", "npm"]]);
  expect(walk(block, bindings).handled).toBe(true);
  expect(bindings.get("value")).toBe("npm");

  const reassignment = parse('let command = "npm"; { command = "curl"; }', {
    sourceType: "module",
  }).program.body[1];
  const outerBindings = new Map([["command", "npm"]]);
  walk(reassignment, outerBindings);
  expect(outerBindings.has("command")).toBe(false);
});

test("expands statically resolvable loops and skips dynamic loops", () => {
  const staticLoop = parse("for (const command of commands) { run(command); }", {
    sourceType: "module",
  }).program.body[0];
  const staticResult = walk(staticLoop, new Map([["commands", ["npm", "node"]]]));
  expect(staticResult.handled).toBe(true);
  expect(staticResult.visited.filter(({ type }) => type === "BlockStatement")).toHaveLength(2);

  const dynamicLoop = parse("for (const command of unknown) { run(command); }", {
    sourceType: "module",
  }).program.body[0];
  expect(walk(dynamicLoop, new Map()).handled).toBe(true);
});

test("adds resolvable identifier declarations to static bindings", () => {
  const declarations = parse(
    'const command = "npm"; const dynamic = unknown; const [destructured] = ["x"];',
    { sourceType: "module" },
  ).program.body;
  const bindings = new Map();
  for (const declaration of declarations) traverseKnitBindingNode(declaration, bindings, () => {});
  expect(bindings).toEqual(new Map([["command", "npm"]]));
});

test("keeps destructured block declarations local and visits assignment loops", () => {
  const block = parse('let command = "npm"; { const [command] = values; }', {
    sourceType: "module",
  }).program.body[1];
  const bindings = new Map([["command", "npm"]]);
  walk(block, bindings);
  expect(bindings.get("command")).toBe("npm");

  const loop = parse("for (command of commands) run(command);", {
    sourceType: "module",
  }).program.body[0];
  const visited = [];
  expect(
    traverseKnitBindingNode(loop, new Map([["commands", ["npm"]]]), (node) => {
      visited.push(node);
    }),
  ).toBe(true);
  expect(visited).toContain(loop.body);
});

test("handles assignment nodes without a supported target", () => {
  const bindings = new Map([["command", "npm"]]);
  expect(traverseKnitBindingNode({ type: "AssignmentExpression" }, bindings, () => {})).toBe(false);
  expect(bindings.get("command")).toBe("npm");
});
