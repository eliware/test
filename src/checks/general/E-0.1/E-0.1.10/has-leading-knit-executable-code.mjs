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
    return (
      !statement.superClass &&
      !statement.decorators?.length &&
      !statement.body.body.some((element) => {
        if (element.decorators?.length || element.computed) return true;
        if (element.type === "StaticBlock")
          return element.body.some((child) => !isInertStatement(child));
        return Boolean(
          element.static && element.value && containsExecutableExpression(element.value),
        );
      })
    );
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

export function hasLeadingKnitExecutableCode(program, firstCommandStart) {
  return program.body.some(
    (statement) => statement.end <= firstCommandStart && !isInertStatement(statement),
  );
}
