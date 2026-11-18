export default function collectCommonJsAliases(root) {
  const aliases = {
    require: new Set(["require"]),
    module: new Set(["module"]),
    exports: new Set(["exports"]),
  };
  let changed = true;
  while (changed) {
    changed = false;
    visit(root, (node) => {
      const value = node.init ?? node.right;
      if (["VariableDeclarator", "AssignmentExpression"].includes(node.type)) {
        const name = node.id?.name ?? node.left?.name;
        if (value?.type === "Identifier") {
          for (const group of Object.values(aliases)) {
            if (name && group.has(value.name) && !group.has(name)) {
              group.add(name);
              changed = true;
            }
          }
        }
        const object = value?.object?.name;
        const property = value?.computed ? value.property?.value : value?.property?.name;
        if (
          node.type === "VariableDeclarator" &&
          value?.type === "MemberExpression" &&
          aliases.module.has(object) &&
          property === "exports" &&
          name &&
          !aliases.exports.has(name)
        ) {
          aliases.exports.add(name);
          changed = true;
        }
        if (
          node.type === "VariableDeclarator" &&
          value?.type === "Identifier" &&
          aliases.module.has(value.name) &&
          node.id?.type === "ObjectPattern"
        ) {
          for (const item of node.id.properties ?? []) {
            const key = item.key?.name ?? item.key?.value;
            const alias = item.value?.name ?? item.value?.left?.name;
            if (key === "exports" && alias && !aliases.exports.has(alias)) {
              aliases.exports.add(alias);
              changed = true;
            }
          }
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
