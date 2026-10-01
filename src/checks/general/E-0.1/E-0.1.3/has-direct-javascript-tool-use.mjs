import { parse } from "@babel/parser";

const toolPackage = /^(?:@jest\/[^/]+|jest(?:\/|$)|oxlint(?:\/|$)|prettier(?:\/|$))/;
const toolCommand =
  /^(?:(?:npx|npm\s+(?:exec|run))\s+(?:[^\s;&|]+\s+)*)?(?:jest|oxlint|prettier)(?=$|[\s"'`=:;,)&|])/;
const testApiImport = /^\s*import\s+(?:[\s\S]*?\s+from\s+)?["']@jest\/globals["'];?\s*$/gim;

function collectJavaScriptToolUse(ast, allowTestApi) {
  const childProcessBindings = new Set();
  const childProcessNamespaces = new Set();
  let found = false;
  const visit = (node) => {
    const moduleSource = node.source?.value;
    if (
      (node.type === "ImportDeclaration" ||
        node.type === "ExportNamedDeclaration" ||
        node.type === "ExportAllDeclaration") &&
      typeof moduleSource === "string"
    ) {
      if (toolPackage.test(moduleSource) && !(allowTestApi && moduleSource === "@jest/globals"))
        found = true;
      if (/^(?:node:)?child_process$/.test(moduleSource)) {
        for (const specifier of node.specifiers ?? []) {
          if (specifier.type === "ImportNamespaceSpecifier") {
            childProcessNamespaces.add(specifier.local.name);
          } else if (
            specifier.imported?.name &&
            /^(?:spawn|spawnSync|exec|execSync|execFile|execFileSync)$/.test(
              specifier.imported.name,
            )
          )
            childProcessBindings.add(specifier.local.name);
        }
      }
    }
    if (
      node.type === "CallExpression" &&
      node.callee.type === "Import" &&
      toolPackage.test(node.arguments?.[0]?.value ?? "")
    )
      found = true;
    if (
      node.type === "CallExpression" &&
      ((node.callee.type === "Identifier" && childProcessBindings.has(node.callee.name)) ||
        (node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          childProcessNamespaces.has(node.callee.object.name) &&
          /^(?:spawn|spawnSync|exec|execSync|execFile|execFileSync)$/.test(
            node.callee.property.name,
          ))) &&
      toolCommand.test(node.arguments[0]?.value ?? "")
    )
      found = true;
    for (const [key, value] of Object.entries(node)) {
      if (["comments", "extra", "loc", "tokens"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach((child) => child?.type && visit(child));
      else if (value?.type) visit(value);
    }
  };
  visit(ast);
  return found;
}

export function hasDirectJavaScriptToolUse(content, allowTestApi = false) {
  const source = allowTestApi ? content.replace(testApiImport, "") : content;
  const ast = parse(source, {
    sourceType: "unambiguous",
    plugins: ["typescript", "jsx", "topLevelAwait"],
  });
  return collectJavaScriptToolUse(ast, allowTestApi);
}
