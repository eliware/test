import { collectCalls } from "./knit-ast-traversal.mjs";
import { collectImports } from "./knit-import-analysis.mjs";

const executableNodeTypes = new Set([
  "CallExpression",
  "OptionalCallExpression",
  "NewExpression",
  "MemberExpression",
  "AssignmentExpression",
  "UpdateExpression",
  "AwaitExpression",
  "YieldExpression",
  "TaggedTemplateExpression",
]);
const astMetadata = new Set(["loc", "start", "end", "extra", "comments"]);

function containsExecutableExpression(node) {
  if (!node || typeof node !== "object") return false;
  if (executableNodeTypes.has(node.type)) return true;
  return Object.entries(node).some(([key, value]) => {
    if (astMetadata.has(key)) return false;
    return Array.isArray(value)
      ? value.some(containsExecutableExpression)
      : containsExecutableExpression(value);
  });
}

function isInertStatement(statement) {
  if (["ImportDeclaration", "FunctionDeclaration", "EmptyStatement"].includes(statement.type))
    return true;
  if (statement.type === "ClassDeclaration") {
    return !statement.superClass && !(statement.decorators?.length) && !statement.body.body.some((element) => {
      if (element.decorators?.length || element.computed) return true;
      if (element.type === "StaticBlock") return element.body.some((child) => !isInertStatement(child));
      return Boolean(element.static && element.value && containsExecutableExpression(element.value));
    });
  }
  if (statement.type === "VariableDeclaration")
    return statement.declarations.every(
      (declaration) => !containsExecutableExpression(declaration.init),
    );
  if (statement.type === "ExportNamedDeclaration") {
    return !statement.source && (!statement.declaration || isInertStatement(statement.declaration));
  }
  if (statement.type === "ExportDefaultDeclaration") return isInertStatement(statement.declaration);
  if (statement.type === "ExpressionStatement")
    return statement.directive !== undefined || !containsExecutableExpression(statement.expression);
  return false;
}

export function analyzeKnitScriptAst(ast) {
  const calls = [];
  const imports = collectImports(ast.program);
  const unsupported = [...imports.unsupported];
  collectCalls(ast.program, new Map(), imports, calls, unsupported);
  for (const statement of ast.program.body) {
    if (
      (statement.type === "ImportDeclaration" && statement.source.value !== "node:child_process") ||
      ((statement.type === "ExportNamedDeclaration" || statement.type === "ExportAllDeclaration") &&
        statement.source)
    )
      unsupported.push(statement.start);
  }
  const orderedCalls = calls.sort((left, right) => left.start - right.start);
  const firstCommand = orderedCalls[0]?.start ?? Number.POSITIVE_INFINITY;
  const leadingExecutable = ast.program.body.some(
    (statement) => statement.end <= firstCommand && !isInertStatement(statement),
  );
  return { calls: orderedCalls, unsupported: [...new Set(unsupported)], leadingExecutable };
}
