import { join, posix } from "node:path";
import { isPureExportBarrel } from "./is-pure-export-barrel.mjs";

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
