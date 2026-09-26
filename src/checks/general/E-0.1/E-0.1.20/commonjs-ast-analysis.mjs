export function collectCommonJsFindings(node, findings, file) {
  if (!node || typeof node !== "object") return;
  if (node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "require")
    findings.push(`${file}: require()`);
  if (node.type === "MemberExpression" && node.object.type === "Identifier" &&
    (node.object.name === "module" || node.object.name === "exports") &&
    ((node.property.type === "Identifier" && node.property.name === "exports") || node.object.name === "exports"))
    findings.push(`${file}: CommonJS export`);
  if (node.type === "Identifier" && ["__dirname", "__filename"].includes(node.name))
    findings.push(`${file}: CommonJS identifier ${node.name}`);
  if (node.type === "CallExpression" && node.callee.type === "MemberExpression" &&
    node.callee.object.type === "MetaProperty" && node.callee.object.meta.name === "import" &&
    node.callee.property.type === "Identifier" && node.callee.property.name === "require")
    findings.push(`${file}: import.meta.require()`);
  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "start" || key === "end") continue;
    if (Array.isArray(value)) value.forEach((child) => collectCommonJsFindings(child, findings, file));
    else if (value && typeof value === "object") collectCommonJsFindings(value, findings, file);
  }
}
