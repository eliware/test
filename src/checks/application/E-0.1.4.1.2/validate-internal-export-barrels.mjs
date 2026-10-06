import { parse } from "@babel/parser";
import { join, posix } from "node:path";

export async function validateInternalExportBarrels(files, readText, packageJson, root) {
  const publicTargets = collectPublicTargets(packageJson);
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

function isPureExportBarrel(content) {
  let program;
  try {
    program = parse(content, { sourceType: "module" }).program;
  } catch {
    return false;
  }
  return (
    program.body.length > 0 &&
    program.body.every(
      (node) =>
        (node.type === "ExportNamedDeclaration" && !node.declaration && node.source) ||
        (node.type === "ExportAllDeclaration" && node.source),
    )
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
