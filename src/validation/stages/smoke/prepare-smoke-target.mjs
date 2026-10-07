import { rm } from "node:fs/promises";
import { join } from "node:path";

export function hasPackageDependency(targetPackage, packageName) {
  return ["dependencies", "devDependencies", "optionalDependencies"].some((field) =>
    Object.hasOwn(targetPackage[field] ?? {}, packageName),
  );
}

export async function prepareSmokeTarget({ targetRoot, packageName }) {
  await rm(join(targetRoot, "node_modules", ...packageName.split("/")), {
    recursive: true,
    force: true,
  });
}
