import {
  collectCommonJsAliases,
  collectCommonJsExportAliases,
} from "./collect-commonjs-aliases.mjs";

export function collectCommonJsFindings(node, findings, file) {
  if (!node || typeof node !== "object") return;
  const aliases = collectCommonJsAliases(node, "require");
  const moduleAliases = collectCommonJsAliases(node, "module");
  const exportsAliases = collectCommonJsExportAliases(node);
  walk(node, findings, file, aliases, moduleAliases, exportsAliases);
}

function walk(node, findings, file, requires, modules, exportAliases) {
  if (!node || typeof node !== "object") return;
  if (
    node.type === "CallExpression" &&
    node.callee?.type === "Identifier" &&
    requires.has(node.callee.name)
  )
    findings.push(`${file}: require()`);
  if (
    node.type === "OptionalCallExpression" &&
    node.callee?.type === "Identifier" &&
    requires.has(node.callee.name)
  )
    findings.push(`${file}: require()`);
  if (
    ["VariableDeclarator", "AssignmentExpression"].includes(node.type) &&
    (node.init ?? node.right)?.type === "Identifier" &&
    requires.has((node.init ?? node.right).name)
  )
    findings.push(`${file}: require alias`);
  if (
    (node.type === "TSImportEqualsDeclaration" &&
      node.moduleReference?.type === "TSExternalModuleReference") ||
    node.type === "TSExportAssignment"
  )
    findings.push(`${file}: TypeScript CommonJS module syntax`);
  if (
    ["MemberExpression", "OptionalMemberExpression"].includes(node.type) &&
    node.object?.type === "Identifier" &&
    modules.has(node.object.name) &&
    ((node.property?.type === "Identifier" && node.property.name === "require") ||
      (node.property?.type === "StringLiteral" && node.property.value === "require"))
  )
    findings.push(`${file}: module.require()`);
  if (
    ["MemberExpression", "OptionalMemberExpression"].includes(node.type) &&
    node.object?.type === "Identifier" &&
    requires.has(node.object.name)
  )
    findings.push(`${file}: require()`);
  if (
    ["MemberExpression", "OptionalMemberExpression"].includes(node.type) &&
    node.object?.type === "Identifier" &&
    (modules.has(node.object.name) || exportAliases.has(node.object.name)) &&
    ((node.property?.type === "Identifier" && node.property.name === "exports") ||
      (node.property?.type === "StringLiteral" && node.property.value === "exports") ||
      exportAliases.has(node.object.name) ||
      (modules.has(node.object.name) && node.computed))
  )
    findings.push(`${file}: CommonJS export`);
  if (node.type === "Identifier" && ["__dirname", "__filename"].includes(node.name))
    findings.push(`${file}: CommonJS identifier ${node.name}`);
  if (
    node.type === "CallExpression" &&
    node.callee?.type === "MemberExpression" &&
    node.callee.object?.type === "MetaProperty" &&
    node.callee.object.meta?.name === "import" &&
    node.callee.property?.type === "Identifier" &&
    node.callee.property.name === "require"
  )
    findings.push(`${file}: import.meta.require()`);
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end"].includes(key)) continue;
    if (Array.isArray(value))
      value.forEach((child) => walk(child, findings, file, requires, modules, exportAliases));
    else if (value && typeof value === "object")
      walk(value, findings, file, requires, modules, exportAliases);
  }
}
