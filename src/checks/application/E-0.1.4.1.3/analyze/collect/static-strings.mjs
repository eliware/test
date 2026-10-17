import { readStaticString } from "../../read-static-string.mjs";
import { visitAst } from "../../visit-ast.mjs";

export function collectStaticStrings(root) {
  const strings = new Map();
  visitAst(root, (node) => {
    if (["VariableDeclarator", "AssignmentExpression"].includes(node.type)) {
      const binding = node.id ?? node.left;
      const value = readStaticString(node.init ?? node.right, strings);
      if (binding?.type === "Identifier" && value !== null) strings.set(binding.name, value);
    }
    return false;
  });
  return strings;
}
