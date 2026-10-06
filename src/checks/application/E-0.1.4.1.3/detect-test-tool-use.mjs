import { parse } from "@babel/parser";
import { collectLauncherAliases, isLauncher } from "./collect-launcher-aliases.mjs";

const toolName =
  /^(?:@jest\/(?!globals$)[^/]+|@vitest\/|@tapjs\/|@wdio\/|@cypress\/|@istanbuljs\/|jest(?:-|$)|vitest(?:\/|$)|mocha(?:\/|$)|ava$|tap$|tape$|uvu$|c8$|nyc$|istanbul(?:-|$)|babel-plugin-istanbul$|node:test$|playwright$|@playwright\/|cypress$|jasmine$|@bcoe\/v8-coverage$)/iu;
const commandName =
  /(?:^|[\s/\\])(?:jest|vitest|mocha|ava|tap|tape|uvu|c8|nyc|istanbul|playwright|cypress|karma|jasmine|qunit|wdio|nightwatch|testcafe|protractor)(?:\.cmd)?(?:[\s/\\]|$)|\bnode(?:\.exe)?\s+(?:--[\w-]+(?:=\S+)?\s+)*--test(?=$|\s)|\b(?:bun|deno)\s+test(?:\s|$)/iu;
export function detectTestToolUse(content, allowHarnessTools = false) {
  let ast;
  try {
    ast = parse(content, {
      sourceType: "unambiguous",
      errorRecovery: true,
      plugins: ["jsx", "typescript"],
    });
  } catch {
    return true;
  }
  const strings = collectStaticStrings(ast.program);
  const launchNames = collectLauncherAliases(ast.program);
  return visit(ast.program, (node) => {
    const specifier = importSpecifier(node, strings);
    if (
      specifier &&
      toolName.test(specifier) &&
      !(allowHarnessTools && specifier === "istanbul-lib-instrument")
    )
      return true;
    if (
      isModuleLoad(node) &&
      node.arguments.some((argument) => toolName.test(staticString(argument, strings) ?? ""))
    )
      return true;
    if (node.type === "CallExpression" && isLauncher(node.callee, launchNames)) {
      const command = node.arguments
        .flatMap((argument) => collectStrings(argument, strings))
        .join(" ");
      if (commandName.test(command)) return true;
    }
    return false;
  });
}

function collectStaticStrings(root) {
  const strings = new Map();
  visit(root, (node) => {
    if (["VariableDeclarator", "AssignmentExpression"].includes(node.type)) {
      const binding = node.id ?? node.left;
      const value = staticString(node.init ?? node.right, strings);
      if (binding?.type === "Identifier" && value !== null) strings.set(binding.name, value);
    }
    return false;
  });
  return strings;
}

function staticString(node, strings) {
  if (node?.type === "StringLiteral") return node.value;
  if (node?.type === "BinaryExpression" && node.operator === "+") {
    const left = staticString(node.left, strings);
    const right = staticString(node.right, strings);
    return left !== null && right !== null ? left + right : null;
  }
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0)
    return node.quasis[0].value.cooked;
  if (node?.type === "Identifier") return strings.get(node.name) ?? null;
  return null;
}

function importSpecifier(node, strings) {
  if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type))
    return staticString(node.source, strings);
  if (node.type === "ImportExpression") return staticString(node.source, strings);
  return null;
}

function isModuleLoad(node) {
  return (
    node.type === "CallExpression" &&
    ((node.callee?.type === "Identifier" && ["require", "load"].includes(node.callee.name)) ||
      node.callee?.type === "Import")
  );
}

function collectStrings(node, strings) {
  const value = staticString(node, strings);
  if (value !== null) return [value];
  if (Array.isArray(node)) return node.flatMap((item) => collectStrings(item, strings));
  if (node && typeof node === "object")
    return Object.values(node).flatMap((item) => collectStrings(item, strings));
  return [];
}

function visit(node, callback) {
  if (!node || typeof node !== "object") return false;
  if (callback(node)) return true;
  return Object.values(node).some((value) =>
    Array.isArray(value) ? value.some((child) => visit(child, callback)) : visit(value, callback),
  );
}
