import { collectCommonJsAliases } from "./aliases.mjs";

export function collectCommonJsExportAliases(root) {
  const modules = collectCommonJsAliases(root, "module");
  const aliases = collectCommonJsAliases(root, "exports");
  let changed = true;
  while (changed) {
    changed = false;
    visit(root, (node) => {
      if (node.type !== "VariableDeclarator") return;
      const init = node.init;
      const object = init?.object?.name;
      const property = init?.computed ? init.property?.value : init?.property?.name;
      const moduleExports =
        init?.type === "MemberExpression" && modules.has(object) && property === "exports";
      const forwarded = init?.type === "Identifier" && aliases.has(init.name);
      if (
        init?.type === "Identifier" &&
        modules.has(init.name) &&
        node.id?.type === "ObjectPattern"
      ) {
        for (const item of node.id.properties ?? []) {
          const key = item.key?.name ?? item.key?.value;
          const name = item.value?.name ?? item.value?.left?.name;
          if (key === "exports" && name && !aliases.has(name)) {
            aliases.add(name);
            changed = true;
          }
        }
      }
      if (node.id?.type !== "Identifier") return;
      if ((moduleExports || forwarded) && !aliases.has(node.id.name)) {
        aliases.add(node.id.name);
        changed = true;
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
