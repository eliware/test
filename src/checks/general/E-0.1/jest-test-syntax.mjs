const defaultTestNames = new Set(["test", "it"]);
const mockMethods = new Set(["mock", "doMock", "mockModule", "unstable_mockModule"]);
const callbackTypes = new Set([
  "ArrowFunctionExpression",
  "CallExpression",
  "FunctionExpression",
  "Identifier",
  "MemberExpression",
  "OptionalCallExpression",
]);

export function collectApiNames(ast) {
  const testNames = new Set(defaultTestNames);
  const jestNames = new Set(["jest"]);
  visitAst(ast, (node) => {
    if (node.type !== "ImportDeclaration" || staticString(node.source) !== "@jest/globals") return;
    for (const specifier of node.specifiers) {
      const imported = specifier.imported?.name;
      if (imported === "test" || imported === "it") testNames.add(specifier.local.name);
      if (imported === "jest") jestNames.add(specifier.local.name);
    }
  });
  return { jestNames, testNames };
}

export function isExecutableTestCall(node, testNames) {
  if (node.arguments.length < 2 || !callbackTypes.has(node.arguments.at(-1)?.type)) return false;
  const callee = node.callee;
  if (callee?.type === "Identifier") return testNames.has(callee.name);
  if (callee?.type === "MemberExpression" || callee?.type === "OptionalMemberExpression") {
    const { rootName, properties } = memberPath(callee);
    return (
      testNames.has(rootName) &&
      properties.some((property) => ["only", "concurrent", "failing"].includes(property)) &&
      !properties.some((property) => ["each", "skip", "todo"].includes(property))
    );
  }
  if (callee?.type === "CallExpression" || callee?.type === "OptionalCallExpression") {
    if (callee.callee?.type !== "MemberExpression") return false;
    const { rootName, properties } = memberPath(callee.callee);
    return testNames.has(rootName) && properties.includes("each") && !properties.includes("skip");
  }
  return false;
}

export function isRequireCall(callee) {
  return callee?.type === "Identifier" && callee.name === "require";
}

export function isMockCall(callee, jestNames) {
  if (callee?.type !== "MemberExpression" || !mockMethods.has(propertyName(callee))) return false;
  return jestNames.has(memberPath(callee).rootName);
}

export function staticString(node) {
  if (node?.type === "StringLiteral") return node.value;
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0)
    return node.quasis[0]?.value.cooked;
  return null;
}

export function visitAst(node, visitor) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((child) => visitAst(child, visitor));
    return;
  }
  if (typeof node.type === "string") visitor(node);
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end", "comments", "tokens", "errors"].includes(key)) continue;
    if (value && typeof value === "object") visitAst(value, visitor);
  }
}

function memberPath(node) {
  const properties = [];
  let current = node;
  while (current?.type === "MemberExpression" || current?.type === "OptionalMemberExpression") {
    properties.unshift(propertyName(current));
    current = current.object;
  }
  return { rootName: current?.type === "Identifier" ? current.name : null, properties };
}

function propertyName(node) {
  return node.computed ? staticString(node.property) : node.property?.name;
}
