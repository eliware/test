import { parse } from "@babel/parser";
import { identifierOrMemberRoot, memberChain } from "./knit-member-chain.mjs";

const sideEffectModules = new Set([
  "node:fs", "fs", "node:fs/promises", "fs/promises",
  "node:http", "http", "node:https", "https", "node:net", "net", "node:dgram", "dgram",
  "node:process", "process",
]);
const commonSideEffectRoots = new Set(["fs", "fsp", "http", "https", "net", "dgram"]);
const processOperations = new Set(["exit", "kill", "abort"]);
const networkOperations = new Set(["fetch", "request", "connect", "createConnection"]);
const effectGlobals = new Set(["process", "globalThis", "fetch"]);

export function validateKnitSourceOperations(source, parsedAst = null) {
  let program = parsedAst?.program;
  try {
    program ??= parse(source, {
      sourceType: "module",
      plugins: ["importAttributes", "topLevelAwait"],
      allowUndeclaredExports: true,
    }).program;
  } catch {
    return ".knit/validate.mjs is not valid JavaScript.";
  }

  const namespaces = new Set();
  const importedOperations = new Set();
  for (const statement of program.body) {
    if (statement.type === "ImportDeclaration" && sideEffectModules.has(statement.source.value)) {
      for (const specifier of statement.specifiers) {
        if (specifier.type === "ImportSpecifier") importedOperations.add(specifier.local.name);
        else namespaces.add(specifier.local.name);
      }
    }
  }
  if (hasUnsupportedAlias(program)) {
    return ".knit/validate.mjs contains an unsupported filesystem, network, process, or subprocess operation.";
  }

  let unsupported = false;
  function visit(node) {
    if (!node || unsupported) return;
    if (node.type === "CallExpression" || node.type === "OptionalCallExpression") {
      const callee = node.callee;
      if (callee.type === "Identifier" &&
          (importedOperations.has(callee.name) || effectGlobals.has(callee.name) ||
            processOperations.has(callee.name) || networkOperations.has(callee.name))) {
        unsupported = true;
        return;
      }
      if (callee.type === "MemberExpression" || callee.type === "OptionalMemberExpression") {
        const { root, names } = memberChain(callee);
        if (namespaces.has(root) || commonSideEffectRoots.has(root) ||
            (root === "process" && (names.includes(undefined) || names.some((name) =>
              processOperations.has(name) || networkOperations.has(name) || name === "require"))) ||
            (root === "globalThis" && (names.includes(undefined) || names.some((name) =>
              networkOperations.has(name) || name === "require")))) {
          unsupported = true;
          return;
        }
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  }
  visit(program);
  return unsupported
    ? ".knit/validate.mjs contains an unsupported filesystem, network, process, or subprocess operation."
    : null;
}

function hasUnsupportedAlias(node) {
  if (node.type === "VariableDeclaration") {
    for (const declaration of node.declarations) {
      const source = identifierOrMemberRoot(declaration.init);
      if (!source || !effectGlobals.has(source)) continue;
      if (declaration.id.type === "Identifier") return true;
      if (declaration.id.type !== "ObjectPattern") return true;
      for (const property of declaration.id.properties) {
        if (property.type === "RestElement") return true;
        if (property.value?.type === "ObjectPattern" || property.value?.type === "ArrayPattern") return true;
        const operation = property.computed
          ? property.key.type === "StringLiteral" ? property.key.value : undefined
          : property.key.name;
        if (!operation || processOperations.has(operation) || networkOperations.has(operation) || operation === "require") return true;
      }
    }
  }
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
    if (Array.isArray(value)) {
      if (value.some(hasUnsupportedAlias)) return true;
    } else if (value && typeof value === "object" && hasUnsupportedAlias(value)) return true;
  }
  return false;
}
