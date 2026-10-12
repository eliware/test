import { join, posix } from "node:path";
import { isPureExportBarrel } from "./is-pure-export-barrel.mjs";

export async function validateInternalExportBarrels(
  files,
  readText,
  packageJson,
  root,
  options = {},
) {
  const publicTargets = collectPublicTargets(packageJson, options);
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

function collectPublicTargets(packageJson, options) {
  const library = options?.library ?? false;
  const declarationTargets = library
    ? [packageJson.types, packageJson.typings, ...collectDeclarationExports(packageJson.exports)]
    : [];
  const targets = new Set();
  const visit = (value, allowBarePath, skipTypesCondition = false) => {
    if (typeof value === "string") {
      if (value.startsWith("./")) targets.add(posix.normalize(value.slice(2)));
      else if (allowBarePath && !value.startsWith("#") && !value.includes(":"))
        targets.add(posix.normalize(value));
    } else if (Array.isArray(value))
      value.forEach((entry) => visit(entry, allowBarePath, skipTypesCondition));
    else if (value && typeof value === "object")
      Object.entries(value)
        .filter(([key]) => !skipTypesCondition || key !== "types")
        .forEach(([, entry]) => visit(entry, allowBarePath, skipTypesCondition));
  };
  visit(packageJson.main, true);
  visit(packageJson.bin, true);
  visit(packageJson.exports, false, true);
  for (const target of declarationTargets)
    if (typeof target === "string" && target.startsWith("./") && target.endsWith(".d.ts"))
      targets.add(posix.normalize(target.slice(2, -5) + ".mjs"));
  return targets;
}

function collectDeclarationExports(exportsValue) {
  if (typeof exportsValue === "string") return exportsValue.endsWith(".d.ts") ? [exportsValue] : [];
  if (Array.isArray(exportsValue)) return exportsValue.flatMap(collectDeclarationExports);
  if (!exportsValue || typeof exportsValue !== "object") return [];
  return Object.values(exportsValue).flatMap(collectDeclarationExports);
}
