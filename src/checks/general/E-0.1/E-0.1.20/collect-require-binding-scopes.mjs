import { patternHasRequire } from "./pattern-has-require-binding.mjs";
import { isFunctionNode } from "./is-function-node.mjs";

export function collectRequireBindingScopes(root) {
  const scopes = new WeakSet();
  visit(root, null);
  return scopes;

  function visit(node, parentVariableScope) {
    if (!node || typeof node !== "object") return;
    const ownsVariables = node.type === "Program" || isFunctionNode(node);
    const variableScope = ownsVariables ? { node, hasRequire: false } : parentVariableScope;
    // codescope ignore: each Program or BlockStatement scans only its direct body once; recursive traversal visits descendants separately without rescanning nested statements
    if (
      (node.type === "Program" || node.type === "BlockStatement") &&
      node.body.some((statement) => declaresDirectRequire(statement, node.type === "Program"))
    ) {
      scopes.add(node);
    }
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
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach((child) => visit(child, variableScope));
      else if (value && typeof value === "object") visit(value, variableScope);
    }
    if (ownsVariables && variableScope.hasRequire) scopes.add(node);
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
