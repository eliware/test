import { patternHasRequire } from "./pattern-has-require-binding.mjs";
import { isFunctionNode } from "./is-function-node.mjs";

export function collectRequireBindingScopes(root) {
  const scopes = new WeakSet();
  const activePath = new WeakSet();
  const pending = [{ node: root, parentVariableScope: null, finish: false }];
  while (pending.length > 0) {
    const frame = pending.pop();
    const { node, parentVariableScope } = frame;
    if (frame.finish) {
      activePath.delete(node);
      if (frame.ownsVariables && frame.variableScope.hasRequire) scopes.add(node);
      continue;
    }
    if (!node || typeof node !== "object" || activePath.has(node)) continue;
    activePath.add(node);
    const ownsVariables = node.type === "Program" || isFunctionNode(node);
    const variableScope = ownsVariables ? { node, hasRequire: false } : parentVariableScope;
    const isBodyScope = node.type === "Program" || node.type === "BlockStatement";
    inspectNodeBindings(node, variableScope, scopes);
    pending.push({ node, variableScope, finish: true, ownsVariables });
    const children = [];
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end"].includes(key)) continue;
      if (Array.isArray(value)) {
        for (const child of value) {
          if (
            key === "body" &&
            isBodyScope &&
            declaresDirectRequire(child, node.type === "Program")
          )
            scopes.add(node);
          if (child && typeof child === "object") children.push(child);
        }
      } else if (value && typeof value === "object") children.push(value);
    }
    for (let index = children.length - 1; index >= 0; index -= 1)
      pending.push({ node: children[index], parentVariableScope: variableScope, finish: false });
  }
  return scopes;
}

function inspectNodeBindings(node, variableScope, scopes) {
  if (
    node.type === "ForStatement" ||
    node.type === "ForInStatement" ||
    node.type === "ForOfStatement"
  ) {
    const declaration = node.init ?? node.left;
    if (
      declaration?.type === "VariableDeclaration" &&
      declaration.kind !== "var" &&
      declaration.declarations.some(({ id }) => patternHasRequire(id))
    ) {
      scopes.add(node);
    }
  }
  if (node.type === "CatchClause" && patternHasRequire(node.param)) {
    scopes.add(node);
  }
  if (
    isFunctionNode(node) &&
    (node.params.some(patternHasRequire) ||
      (node.type === "FunctionExpression" && node.id?.name === "require"))
  ) {
    scopes.add(node);
  }
  if (
    node.type === "VariableDeclaration" &&
    node.kind === "var" &&
    node.declarations.some(({ id }) => patternHasRequire(id)) &&
    variableScope
  ) {
    variableScope.hasRequire = true;
  }
}

function declaresDirectRequire(statement, programScope) {
  if (!statement) return false;
  if (
    statement.type === "ExportNamedDeclaration" ||
    statement.type === "ExportDefaultDeclaration"
  ) {
    return declaresDirectRequire(statement.declaration, programScope);
  }
  if (statement.type === "ImportDeclaration") {
    return statement.specifiers.some((specifier) => specifier.local?.name === "require");
  }
  if (statement.type === "VariableDeclaration") {
    return (
      (programScope || statement.kind !== "var") &&
      statement.declarations.some(({ id }) => patternHasRequire(id))
    );
  }
  return (
    ["FunctionDeclaration", "ClassDeclaration"].includes(statement.type) &&
    statement.id?.name === "require"
  );
}
