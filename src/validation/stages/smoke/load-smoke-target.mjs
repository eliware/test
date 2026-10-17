import { readFile } from "node:fs/promises";
import { join } from "node:path";

export function hasPackageDependency(targetPackage, packageName) {
  return ["dependencies", "devDependencies", "optionalDependencies"].some((field) =>
    Object.hasOwn(targetPackage[field] ?? {}, packageName),
  );
}

export async function loadSmokeTarget(targetRoot, packageName) {
  let targetPackage;
  try {
    targetPackage = JSON.parse(await readFile(join(targetRoot, "package.json"), "utf8"));
    if (targetPackage?.name === packageName)
      return { error: "Smoke target must not be the source package repository." };
    await readFile(join(targetRoot, "node_modules", ".package-lock.json"));
    await readFile(join(targetRoot, "node_modules", ...packageName.split("/"), "package.json"));
  } catch {
    return {
      error: "Smoke target must be an existing npm repository with installed dependencies.",
    };
  }
  if (!targetPackage?.scripts?.test)
    return { error: "Smoke target must define an npm test script." };
  if (!hasPackageDependency(targetPackage, packageName))
    return { error: `Smoke target must list ${packageName} in package.json dependencies.` };
  return { targetPackage, error: null };
}
