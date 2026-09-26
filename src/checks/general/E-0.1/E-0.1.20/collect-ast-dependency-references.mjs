function dependencyFor(specifier, declared) {
  if (typeof specifier !== "string") return undefined;
  return declared.find((name) => specifier === name || specifier.startsWith(`${name}/`));
}

function mayNameDeclaredDependency(node, declared) {
  if (!node) return false;
  if (node.type === "StringLiteral") return declared.some((name) => node.value === name || node.value.startsWith(`${name}/`));
  if (node.type === "TemplateLiteral") return node.quasis.some((part) => declared.some((name) => part.value.raw.includes(name)));
  if (node.type === "BinaryExpression") return mayNameDeclaredDependency(node.left, declared) || mayNameDeclaredDependency(node.right, declared);
  return false;
}

export function collectAstReferences(node, declared, referenced, uncertain = { value: false }) {
  if (!node || typeof node !== "object") return;
  if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type)) {
    const name = dependencyFor(node.source?.value, declared);
    if (name) referenced.add(name);
  }
  if (node.type === "ImportExpression") {
    if (node.source.type === "StringLiteral") {
      const name = dependencyFor(node.source.value, declared);
      if (name) referenced.add(name);
    } else if (mayNameDeclaredDependency(node.source, declared)) uncertain.value = true;
  }
  if (node.type === "CallExpression" && node.callee.type === "Import" && node.arguments[0]?.type === "StringLiteral") {
    const name = dependencyFor(node.arguments[0].value, declared);
    if (name) referenced.add(name);
  }
  if (node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "require") {
    if (node.arguments[0]?.type === "StringLiteral") {
      const name = dependencyFor(node.arguments[0].value, declared);
      if (name) referenced.add(name);
    } else if (mayNameDeclaredDependency(node.arguments[0], declared)) uncertain.value = true;
  }
  if (node.type === "CallExpression" && ((node.callee.type === "Identifier" && ["resolve", "resolvePackage"].includes(node.callee.name)) || (node.callee.type === "MemberExpression" && node.callee.property?.name === "resolve"))) {
    const name = dependencyFor(node.arguments[0]?.value, declared);
    if (name) referenced.add(name);
  }
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end"].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((child) => collectAstReferences(child, declared, referenced, uncertain));
    else if (value && typeof value === "object") collectAstReferences(value, declared, referenced, uncertain);
  }
}
