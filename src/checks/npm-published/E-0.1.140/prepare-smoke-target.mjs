import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export function hasPackageDependency(targetPackage, packageName) {
  return ["dependencies", "devDependencies", "optionalDependencies"].some((field) =>
    Object.hasOwn(targetPackage[field] ?? {}, packageName),
  );
}

function dependencyField(targetPackage, packageName) {
  return ["dependencies", "devDependencies", "optionalDependencies"].find((field) =>
    Object.hasOwn(targetPackage[field] ?? {}, packageName),
  );
}

export async function prepareSmokeTarget({
  targetRoot,
  targetPackage,
  packageName,
  tarball,
  run,
  command,
  prefix,
  env,
}) {
  targetPackage[dependencyField(targetPackage, packageName)][packageName] =
    pathToFileURL(tarball).href;
  await writeFile(join(targetRoot, "package.json"), `${JSON.stringify(targetPackage, null, 2)}\n`);
  const lock = await run(
    command,
    [...prefix, "install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"],
    { cwd: targetRoot, env },
  );
  if (lock.code !== 0) throw new Error("Temporary lockfile update failed.");
  await rm(join(targetRoot, "node_modules", ...packageName.split("/")), {
    recursive: true,
    force: true,
  });
}
