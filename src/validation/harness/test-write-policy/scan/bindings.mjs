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

export function collectFilesystemBindings(ast) {
  const namespaceBindings = new Set();
  const restrictedBindings = [];
  visitAst(ast, (node) => {
    if (node.type === "ImportDeclaration") {
      collectImportBindings(node, namespaceBindings, restrictedBindings);
      return;
    }
    if (node.type !== "VariableDeclarator") return;
    trackNamespaceAlias(node, namespaceBindings);
    collectDynamicBindings(node, ast, namespaceBindings, restrictedBindings);
  });
  return { namespaceBindings, restrictedBindings };
}

function collectImportBindings(node, namespaceBindings, restrictedBindings) {
  const moduleName = node.source.value;
  for (const specifier of node.specifiers) {
    const importedName = specifier.imported?.name ?? specifier.imported?.value;
    if (
      (filesystemModules.has(moduleName) && fileMutationApis.has(importedName)) ||
      (temporaryDirectoryModules.has(moduleName) && temporaryDirectoryApis.has(importedName))
    )
      restrictedBindings.push({ node: specifier, name: importedName, type: "import" });
    if (
      specifier.type === "ImportNamespaceSpecifier" ||
      specifier.type === "ImportDefaultSpecifier"
    )
      namespaceBindings.add(specifier.local.name);
  }
}

function collectDynamicBindings(node, ast, namespaceBindings, restrictedBindings) {
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
      restrictedBindings.push({ node: property, name, type: "binding" });
  }
}
