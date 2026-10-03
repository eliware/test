import { statSync } from "node:fs";
import { resolve } from "node:path";

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
  const hasMain = Object.hasOwn(packageJson ?? {}, "main");
  const hasBin = Object.hasOwn(packageJson ?? {}, "bin");
  const hasStart = Object.hasOwn(packageJson?.scripts ?? {}, "start");
  if (
    hasStart &&
    (typeof packageJson.scripts.start !== "string" || !packageJson.scripts.start.trim())
  )
    return false;
  const binTargets =
    typeof bin === "string"
      ? [bin]
      : bin && typeof bin === "object" && !Array.isArray(bin)
        ? Object.values(bin)
        : [];
  if (hasMain && !isBinEntrypoint(packageJson.main)) return false;
  if (hasMain && !existingRepositoryFile(packageJson.main)) return false;
  if (
    hasBin &&
    (binTargets.length === 0 ||
      !binTargets.every(isBinEntrypoint) ||
      !binTargets.every(existingRepositoryFile))
  )
    return false;
  if (hasMain || hasBin) return startReferencesEntrypoint();
  return false;

  function isBinEntrypoint(target) {
    return typeof target === "string" && /^(?:\.\/)?bin\//u.test(target);
  }

  function startReferencesEntrypoint() {
    if (!hasStart) return true;
    const targets = [...(hasMain ? [packageJson.main] : []), ...binTargets];
    return targets.some((target) =>
      packageJson.scripts.start.includes(target.replace(/^\.\//u, "")),
    );
  }

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
    return inspectFile(resolve(repositoryRoot, target));
  }
}
