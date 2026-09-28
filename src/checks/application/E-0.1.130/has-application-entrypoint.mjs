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
  const binTargets =
    typeof bin === "string"
      ? [bin]
      : bin && typeof bin === "object" && !Array.isArray(bin)
        ? Object.values(bin)
        : [];
  const validBinTargets =
    bin === undefined ||
    (binTargets.length > 0 && binTargets.every((target) => existingRepositoryFile(target)));
  if (!validBinTargets) return false;
  const fileTargets = [packageJson?.main, ...binTargets].filter(
    (target) => typeof target === "string" && target.trim(),
  );
  const hasExistingRepositoryFile = fileTargets.some((target) => existingRepositoryFile(target));
  if (hasExistingRepositoryFile) return true;
  return (
    typeof packageJson?.scripts?.start === "string" && Boolean(packageJson.scripts.start.trim())
  );

  function existingRepositoryFile(target) {
    if (typeof target !== "string" || !target.trim()) return false;
    const entrypoint = resolve(repositoryRoot, target);
    const pathFromRoot = relative(repositoryRoot, entrypoint);
    const outsideRepository =
      pathFromRoot === ".." || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot);
    return !outsideRepository && inspectFile(entrypoint);
  }
}
