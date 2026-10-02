import { statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

export function hasApplicationEntrypoint(packageJson, root, inspectFile = isFile) {
  const repositoryRoot = resolve(root);
  const bin = packageJson?.bin;
  const hasMain = Object.hasOwn(packageJson ?? {}, "main") && !isEmptyString(packageJson.main);
  const hasBin =
    Object.hasOwn(packageJson ?? {}, "bin") &&
    !isEmptyString(bin) &&
    !(bin && typeof bin === "object" && !Array.isArray(bin) && Object.keys(bin).length === 0);
  const binTargets =
    typeof bin === "string"
      ? [bin]
      : bin && typeof bin === "object" && !Array.isArray(bin)
        ? Object.values(bin)
        : [];
  if (hasMain && !existingRepositoryFile(packageJson.main)) return false;
  if (hasBin && (binTargets.length === 0 || !binTargets.every(existingRepositoryFile)))
    return false;
  if (hasMain || hasBin) return true;
  return (
    typeof packageJson?.scripts?.start === "string" && Boolean(packageJson.scripts.start.trim())
  );

  function existingRepositoryFile(target) {
    if (
      typeof target !== "string" ||
      !target.trim() ||
      target.includes("\\") ||
      target.startsWith("/") ||
      /^[a-z]:/iu.test(target) ||
      target.split("/").includes("..")
    )
      return false;
    const entrypoint = resolve(repositoryRoot, target);
    const pathFromRoot = relative(repositoryRoot, entrypoint);
    const outsideRepository =
      pathFromRoot === ".." || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot);
    return !outsideRepository && inspectFile(entrypoint);
  }
}

function isEmptyString(value) {
  return typeof value === "string" && !value.trim();
}
