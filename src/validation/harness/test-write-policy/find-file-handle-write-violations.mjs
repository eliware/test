import { visitAst } from "../visit-ast.mjs";

const writeMethods = new Set(["write", "writeFile", "writev"]);

export function findFileHandleWriteViolations(ast, filePath, mockedModules) {
  const handles = collectFileHandles(ast);
  const mocked = collectMockedHandles(ast);
  if ([...mockedModules].some((name) => /^(?:node:)?fs(?:\/promises)?$/u.test(name)))
    for (const handle of handles) mocked.add(handle);
  const violations = [];
  visitAst(ast, (node) => {
    if (!isMemberCall(node) || !writeMethods.has(memberName(node.callee))) return;
    if (!handles.has(rootName(node.callee.object))) return;
    if (mocked.has(rootName(node.callee.object))) return;
    violations.push(
      `${filePath}:${node.loc.start.line} uses a test API that creates files or temporary directories: use of ${memberName(node.callee)}.`,
    );
  });
  return violations;
}

function collectMockedHandles(ast) {
  const mocked = new Set();
  visitAst(ast, (node) => {
    if (node.type === "VariableDeclarator" && isHandleName(node.id?.name)) {
      const properties = node.init?.properties ?? [];
      if (
        properties.some(
          (property) =>
            writeMethods.has(property.key?.name ?? property.key?.value) &&
            property.value?.type === "CallExpression" &&
            property.value.callee?.object?.name === "jest" &&
            property.value.callee?.property?.name === "fn",
        )
      )
        mocked.add(node.id.name);
    }
    if (
      node.type !== "CallExpression" ||
      node.callee?.object?.name !== "jest" ||
      node.callee?.property?.name !== "spyOn"
    )
      return;
    if (isHandleName(node.arguments[0]?.name) && writeMethods.has(node.arguments[1]?.value))
      mocked.add(node.arguments[0].name);
  });
  return mocked;
}

function collectFileHandles(ast) {
  const names = new Set();
  visitAst(ast, (node) => {
    if (isFunction(node)) node.params.forEach((param) => addHandle(param, names));
    if (node.type === "VariableDeclarator" && isHandleName(node.id?.name)) names.add(node.id.name);
  });
  return names;
}

function addHandle(param, names) {
  if (param.type === "Identifier" && isHandleName(param.name)) names.add(param.name);
}

function isFunction(node) {
  return ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(
    node.type,
  );
}

function isHandleName(name) {
  return typeof name === "string" && /^(?:file)?handle$/iu.test(name);
}

function isMemberCall(node) {
  return (
    node.type === "CallExpression" &&
    ["MemberExpression", "OptionalMemberExpression"].includes(node.callee?.type)
  );
}

function memberName(member) {
  return member.computed ? member.property.value : member.property.name;
}

function rootName(node) {
  if (node?.type === "Identifier") return node.name;
  if (["MemberExpression", "OptionalMemberExpression"].includes(node?.type))
    return rootName(node.object);
  return undefined;
}
