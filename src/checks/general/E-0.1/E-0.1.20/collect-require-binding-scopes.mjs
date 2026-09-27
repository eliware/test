import { hasFunctionScopedRequire } from "./has-function-scoped-require.mjs";
import { patternHasRequire } from "./pattern-has-require-binding.mjs";
import { isFunctionNode } from "./is-function-node.mjs";

const isScope = (node) =>
  node?.type === "Program" ||
  node?.type === "BlockStatement" ||
  node?.type === "CatchClause" ||
  isFunctionNode(node);

export function collectRequireBindingScopes(root) {
  const scopes = new WeakSet();
  visit(root);
  return scopes;

  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (isScope(node) && declaresRequireInScope(node)) scopes.add(node);
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  }
}

function declaresRequireInScope(scope) {
  if (scope.type === "CatchClause") return patternHasRequire(scope.param);
  if (isFunctionNode(scope)) {
    if (
      scope.params.some(patternHasRequire) ||
      (scope.type === "FunctionExpression" && scope.id?.name === "require")
    )
      return true;
    return hasFunctionScopedRequire(scope.body);
  }
  const statements = scope.body;
  return (
    statements.some((statement) => declaresDirectRequire(statement, scope.type === "Program")) ||
    (scope.type === "Program" && hasFunctionScopedRequire(scope))
  );
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
