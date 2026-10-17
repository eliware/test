export function collectCommonJsAliases(root, source) {
  const aliases = new Set([source]);
  let changed = true;
  while (changed) {
    changed = false;
    visit(root, (node) => {
      const value = node.init ?? node.right;
      if (
        ["VariableDeclarator", "AssignmentExpression"].includes(node.type) &&
        value?.type === "Identifier" &&
        aliases.has(value.name)
      ) {
        const name = node.id?.name ?? node.left?.name;
        if (name && !aliases.has(name)) {
          aliases.add(name);
          changed = true;
        }
      }
    });
  }
  return aliases;
}

function visit(node, callback) {
  if (!node || typeof node !== "object") return;
  callback(node);
  for (const value of Object.values(node))
    if (Array.isArray(value)) value.forEach((child) => visit(child, callback));
    else if (value && typeof value === "object") visit(value, callback);
}
