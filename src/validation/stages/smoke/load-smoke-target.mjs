import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { hasPackageDependency } from "./prepare-smoke-target.mjs";

export async function loadSmokeTarget(targetRoot, packageName) {
  let targetPackage;
  try {
    targetPackage = JSON.parse(await readFile(join(targetRoot, "package.json"), "utf8"));
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
    return { error: `Smoke target must declare ${packageName} as a dependency.` };
  return { targetPackage, error: null };
}
