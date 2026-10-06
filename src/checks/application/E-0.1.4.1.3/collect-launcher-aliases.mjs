const builtInLaunchers = new Set([
  "spawn",
  "spawnSync",
  "exec",
  "execSync",
  "execFile",
  "execFileSync",
  "fork",
]);

export function collectLauncherAliases(root) {
  const names = new Set(builtInLaunchers);
  let changed = true;
  while (changed) {
    changed = false;
    visit(root, (node) => {
      if (
        node.type === "ImportDeclaration" &&
        ["node:child_process", "child_process"].includes(node.source.value)
      )
        for (const specifier of node.specifiers)
          if (
            specifier.type === "ImportSpecifier" &&
            builtInLaunchers.has(specifier.imported.name) &&
            !names.has(specifier.local.name)
          ) {
            names.add(specifier.local.name);
            changed = true;
          }
      if (
        node.type === "VariableDeclarator" &&
        node.id?.type === "Identifier" &&
        node.init?.type === "Identifier" &&
        names.has(node.init.name) &&
        !names.has(node.id.name)
      ) {
        names.add(node.id.name);
        changed = true;
      }
      return false;
    });
  }
  return names;
}

export function isLauncher(callee, names) {
  const property = callee?.computed ? callee.property?.value : callee?.property?.name;
  return (
    (callee?.type === "Identifier" && names.has(callee.name)) ||
    (callee?.type === "MemberExpression" && names.has(property))
  );
}

function visit(node, callback) {
  if (!node || typeof node !== "object") return;
  callback(node);
  for (const value of Object.values(node))
    if (Array.isArray(value)) value.forEach((child) => visit(child, callback));
    else if (value && typeof value === "object") visit(value, callback);
}
