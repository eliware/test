import visitAst from "../visit-ast.mjs";
import collectFileHandles from "./collect/file-handles.mjs";
import collectMockedHandles from "./collect/file-handles/collect-mocked-handles.mjs";
const writeMethods = new Set(["write", "writeFile", "writev"]);
export default function findFileHandleWriteViolations(ast, filePath) {
  const handles = collectFileHandles(ast);
  const mocked = collectMockedHandles(ast);
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
