import { fileMutationApis, temporaryDirectoryApis } from "../api-names.mjs";
import { visitAst } from "../../visit-ast.mjs";
import { collectFilesystemBindings } from "./bindings.mjs";

export function findFilesystemApiViolations(ast, filePath) {
  const { namespaceBindings, restrictedBindings } = collectFilesystemBindings(ast);
  const violations = [];
  const bindingsByNode = new Map();
  for (const binding of restrictedBindings) {
    const bindings = bindingsByNode.get(binding.node) ?? [];
    bindings.push(binding);
    bindingsByNode.set(binding.node, bindings);
  }
  visitAst(ast, (node) => {
    for (const binding of bindingsByNode.get(node) ?? [])
      addViolation(violations, filePath, binding.node, `${binding.type} of ${binding.name}`);
    if (node.type === "MemberExpression" || node.type === "OptionalMemberExpression")
      inspectMember(node, namespaceBindings, violations, filePath);
  });
  return violations;
}

function inspectMember(node, namespaceBindings, violations, filePath) {
  const property = node.computed ? node.property.value : node.property.name;
  const namespace = rootIdentifier(node.object);
  if (
    namespaceBindings.has(namespace) &&
    (fileMutationApis.has(property) || temporaryDirectoryApis.has(property))
  )
    addViolation(violations, filePath, node, `use of ${property}`);
}

function rootIdentifier(node) {
  if (node?.type === "Identifier") return node.name;
  if (node?.type === "MemberExpression" || node?.type === "OptionalMemberExpression")
    return rootIdentifier(node.object);
  return undefined;
}

function addViolation(violations, filePath, node, detail) {
  violations.push(
    `${filePath}:${node.loc.start.line} uses a test API that creates files or temporary directories: ${detail}.`,
  );
}
