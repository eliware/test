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
    const lines = content
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean);
    if (
      !lines.length ||
      lines.some((line) => !/^export\s+\*?\s*(?:\{[^}]*\})?\s+from\s+["'][^"']+["'];?$/u.test(line))
    )
      continue;
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
