import {
  fileMutationApis,
  filesystemModules,
  restrictedModules,
  temporaryDirectoryApis,
  temporaryDirectoryModules,
} from "../api-names.mjs";
import { visitAst } from "../../visit-ast.mjs";
import { trackNamespaceAlias } from "../track-namespace-alias.mjs";
import { getRestrictedModuleName, isModuleMockedForLoad } from "../collect/mocked-modules.mjs";

export function findFilesystemApiViolations(ast, filePath) {
  const namespaceBindings = new Set();
  const violations = [];
  visitAst(ast, (node) => {
    if (node.type === "ImportDeclaration") {
      inspectImport(node, namespaceBindings, violations, filePath);
      return;
    }
    if (node.type === "VariableDeclarator") {
      trackNamespaceAlias(node, namespaceBindings);
      inspectDynamicBinding(node, ast, namespaceBindings, violations, filePath);
    }
    if (node.type === "MemberExpression" || node.type === "OptionalMemberExpression")
      inspectMember(node, namespaceBindings, violations, filePath);
  });
  return violations;
}

function inspectImport(node, namespaceBindings, violations, filePath) {
  const moduleName = node.source.value;
  for (const specifier of node.specifiers) {
    const importedName = specifier.imported?.name ?? specifier.imported?.value;
    if (
      (filesystemModules.has(moduleName) && fileMutationApis.has(importedName)) ||
      (temporaryDirectoryModules.has(moduleName) && temporaryDirectoryApis.has(importedName))
    )
      addViolation(violations, filePath, specifier, `import of ${importedName}`);
    if (
      specifier.type === "ImportNamespaceSpecifier" ||
      specifier.type === "ImportDefaultSpecifier"
    )
      namespaceBindings.add(specifier.local.name);
  }
}

function inspectDynamicBinding(node, ast, namespaceBindings, violations, filePath) {
  const init = node.init?.type === "AwaitExpression" ? node.init.argument : node.init;
  const moduleName = getRestrictedModuleName(init);
  if (moduleName && isModuleMockedForLoad(ast, moduleName, init)) return;
  const dynamicImport = init?.type === "ImportExpression" && restrictedModules.has(moduleName);
  const dynamicRequire =
    init?.type === "CallExpression" &&
    init.callee.type === "Identifier" &&
    init.callee.name === "require" &&
    restrictedModules.has(moduleName);
  if (!dynamicImport && !dynamicRequire) return;
  if (node.id.type === "Identifier") namespaceBindings.add(node.id.name);
  if (node.id.type !== "ObjectPattern") return;
  for (const property of node.id.properties) {
    const name = property.key?.name ?? property.key?.value;
    if (fileMutationApis.has(name) || temporaryDirectoryApis.has(name))
      addViolation(violations, filePath, property, `binding of ${name}`);
  }
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
