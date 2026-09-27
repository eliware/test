function dependencyFor(specifier, declared) {
  if (typeof specifier !== "string") return undefined;
  return declared.find((name) => specifier === name || specifier.startsWith(`${name}/`));
}

function mayNameDeclaredDependency(node, declared) {
  if (!node) return false;
  if (node.type === "StringLiteral")
    return declared.some((name) => node.value === name || node.value.startsWith(`${name}/`));
  if (node.type === "TemplateLiteral")
    return node.quasis.some((part) => declared.some((name) => part.value.raw.includes(name)));
  if (node.type === "BinaryExpression")
    return mayNameDeclaredDependency(node.left, declared) || mayNameDeclaredDependency(node.right, declared);
  return false;
}

export function classifyAstDependencyReference(node, declared, referenced, uncertain, requireShadowed) {
  const addSpecifier = (specifier) => {
    const name = dependencyFor(specifier, declared);
    if (name) referenced.add(name);
  };

  if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type)) {
    addSpecifier(node.source?.value);
  }
  if (node.type === "ImportExpression") {
    if (node.source?.type === "StringLiteral") addSpecifier(node.source.value);
    else if (mayNameDeclaredDependency(node.source, declared)) uncertain.value = true;
  }
  if (node.type === "CallExpression" && node.callee?.type === "Import") {
    if (node.arguments?.[0]?.type === "StringLiteral") addSpecifier(node.arguments[0].value);
  }
  if (node.type === "CallExpression" && !requireShadowed && node.callee?.type === "Identifier" && node.callee.name === "require") {
    if (node.arguments?.[0]?.type === "StringLiteral") addSpecifier(node.arguments[0].value);
    else if (mayNameDeclaredDependency(node.arguments?.[0], declared)) uncertain.value = true;
  }
  if (node.type === "CallExpression" && node.callee?.type === "Identifier" && node.callee.name === "resolvePackage") {
    addSpecifier(node.arguments?.[0]?.value);
  }
  if (
    node.type === "CallExpression" &&
    !requireShadowed &&
    node.callee?.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.object?.type === "Identifier" &&
    node.callee.object.name === "require" &&
    node.callee.property?.type === "Identifier" &&
    node.callee.property.name === "resolve"
  ) {
    addSpecifier(node.arguments?.[0]?.value);
  }
}
