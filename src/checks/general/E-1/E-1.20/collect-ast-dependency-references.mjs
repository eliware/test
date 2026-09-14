function dependencyFor(specifier, declared) {
  if (typeof specifier !== "string") return undefined;
  return declared.find((name) => specifier === name || specifier.startsWith(`${name}/`));
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
    } else uncertain.value = true;
  }
  if (node.type === "CallExpression" && node.callee.type === "Import" && node.arguments[0]?.type === "StringLiteral") {
    const name = dependencyFor(node.arguments[0].value, declared);
    if (name) referenced.add(name);
  }
  if (node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "require") {
    if (node.arguments[0]?.type === "StringLiteral") {
      const name = dependencyFor(node.arguments[0].value, declared);
      if (name) referenced.add(name);
    } else uncertain.value = true;
  }
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end"].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((child) => collectAstReferences(child, declared, referenced, uncertain));
    else if (value && typeof value === "object") collectAstReferences(value, declared, referenced, uncertain);
  }
}
