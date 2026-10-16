import { parse } from "@babel/parser";
import {
  fileMutationApis,
  filesystemModules,
  restrictedModules,
  temporaryDirectoryApis,
  temporaryDirectoryModules,
} from "./api-names.mjs";
import { visitAst } from "../visit-ast.mjs";

export function findTestWritePolicyViolations(source, filePath) {
  const ast = parse(source, {
    sourceType: "unambiguous",
    plugins: ["jsx", "typescript"],
  });
  return findTestWritePolicyViolationsInAst(ast, filePath);
}

export function findTestWritePolicyViolationsInAst(ast, filePath) {
  const namespaceBindings = new Set();
  const violations = [];
  visitAst(ast, (node) => {
    if (node.type === "ImportDeclaration") {
      inspectImport(node, namespaceBindings, violations, filePath);
      return;
    }
    if (node.type === "VariableDeclarator")
      inspectDynamicBinding(node, namespaceBindings, violations, filePath);
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

function inspectDynamicBinding(node, namespaceBindings, violations, filePath) {
  const init = node.init?.type === "AwaitExpression" ? node.init.argument : node.init;
  const dynamicImport =
    init?.type === "ImportExpression" && restrictedModules.has(init.source.value);
  const dynamicRequire =
    init?.type === "CallExpression" &&
    init.callee.type === "Identifier" &&
    init.callee.name === "require" &&
    restrictedModules.has(init.arguments[0]?.value);
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
    (namespaceBindings.has(namespace) && fileMutationApis.has(property)) ||
    (namespaceBindings.has(namespace) && temporaryDirectoryApis.has(property))
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
