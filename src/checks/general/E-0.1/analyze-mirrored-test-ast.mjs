import {
  collectApiNames,
  isExecutableTestCall,
  isMockCall,
  isRequireCall,
  staticString,
  visitAst,
} from "./jest-test-syntax.mjs";

export function inspectMirroredTestAst(ast) {
  const { jestNames, testNames } = collectApiNames(ast);
  const moduleSpecifiers = [];
  let hasExecutableTest = false;
  visitAst(ast, (node) => {
    if (node.type === "ImportDeclaration" || node.type === "ExportAllDeclaration") {
      moduleSpecifiers.push(staticString(node.source));
    } else if (node.type === "ExportNamedDeclaration" && node.source) {
      moduleSpecifiers.push(staticString(node.source));
    } else if (node.type === "CallExpression" || node.type === "OptionalCallExpression") {
      const callee = node.callee;
      if (callee?.type === "Import" || isRequireCall(callee))
        moduleSpecifiers.push(staticString(node.arguments[0]));
      if (isMockCall(callee, jestNames)) moduleSpecifiers.push(staticString(node.arguments[0]));
      if (isExecutableTestCall(node, testNames)) hasExecutableTest = true;
    }
  });
  return { hasExecutableTest, moduleSpecifiers };
}
