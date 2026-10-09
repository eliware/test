import { parse } from "@babel/parser";
import { join, posix } from "node:path";

export async function validateInternalExportBarrels(
  files,
  readText,
  packageJson,
  root,
  options = {},
) {
  const publicTargets = options.library
    ? collectLibraryBarrelTargets(packageJson)
    : collectPublicTargets(packageJson);
  const sources = files.filter((path) => /^src\/.*\.mjs$/u.test(path));
  const errors = [];
  for (const path of sources) {
    let content;
    try {
      content = await readText(join(root, path));
    } catch {
      errors.push(`${path} could not be read to check export barrels.`);
      continue;
    }
    if (!isPureExportBarrel(content)) continue;
    if (publicTargets.has(path)) continue;
    errors.push(`${path} is an internal pure export barrel.`);
  }
  return errors;
}

function collectLibraryBarrelTargets(packageJson) {
  const targets = new Set(collectPublicTargetValues(packageJson.main));
  const packageExports = packageJson.exports;
  const subpathMap =
    packageExports && typeof packageExports === "object" && !Array.isArray(packageExports);
  const hasSubpathKeys =
    subpathMap && Object.keys(packageExports).some((key) => key.startsWith("."));
  const rootExports = hasSubpathKeys ? packageExports["."] : packageExports;
  for (const target of collectPublicTargetValues(rootExports)) targets.add(target);
  for (const target of collectPublicTargetValues(packageExports))
    if (target.endsWith("/index.mjs") || target.endsWith("/index.js")) targets.add(target);
  targets.delete(undefined);
  return targets;
}

function collectPublicTargetValues(value, targets = []) {
  if (typeof value === "string" && value.startsWith("./"))
    targets.push(posix.normalize(value.slice(2)));
  else if (Array.isArray(value))
    value.forEach((entry) => collectPublicTargetValues(entry, targets));
  else if (value && typeof value === "object")
    Object.values(value).forEach((entry) => collectPublicTargetValues(entry, targets));
  return targets;
}

export function isPureExportBarrel(content) {
  let program;
  try {
    program = parse(content, { sourceType: "module" }).program;
  } catch {
    return false;
  }
  if (program.body.length === 0) return false;
  const imported = new Set();
  const exported = new Set();
  for (const node of program.body) {
    if (node.type === "ImportDeclaration") {
      if (node.specifiers.length === 0) return false;
      node.specifiers.forEach((specifier) => imported.add(specifier.local.name));
      continue;
    }
    if (node.type === "ExportAllDeclaration" && node.source) continue;
    if (node.type !== "ExportNamedDeclaration" || node.declaration) return false;
    if (node.source) continue;
    for (const specifier of node.specifiers) {
      exported.add(specifier.local.name);
    }
  }
  return (
    [...exported].every((name) => imported.has(name)) &&
    [...imported].every((name) => exported.has(name))
  );
}

function collectPublicTargets(packageJson) {
  const values = [packageJson.main, packageJson.bin, packageJson.exports];
  const targets = new Set();
  const visit = (value) => {
    if (typeof value === "string" && value.startsWith("./"))
      targets.add(posix.normalize(value.slice(2)));
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") Object.values(value).forEach(visit);
  };
  values.forEach(visit);
  return targets;
}
