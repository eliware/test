import { lstat } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { validateEntrypointMetadata } from "./validate-entrypoint-metadata.mjs";
import { validateStartCommand } from "./validate-start-command.mjs";

export async function validateApplicationEntrypoints(context = {}, dependencies = {}) {
  const root = context.root ?? process.cwd();
  const packageJson = context.packageJson ?? {};
  const errors = validateEntrypointMetadata(packageJson);
  const targets = collectTargets(packageJson);
  for (const target of targets) {
    const checkPath = dependencies.lstat ?? dependencies.stat ?? lstat;
    const error = await validateEntrypointTarget(target, root, checkPath);
    if (error) errors.push(error);
  }
  const startError = validateStartCommand(packageJson, targets);
  if (startError) errors.push(startError);
  return errors;
}

function collectTargets(packageJson) {
  const targets =
    typeof packageJson.bin === "string" ? [packageJson.bin] : Object.values(packageJson.bin ?? {});
  return targets.filter((value) => typeof value === "string");
}

async function validateEntrypointTarget(target, root, checkStat) {
  if (typeof target !== "string" || !target.trim() || isAbsolute(target))
    return `Entrypoint target must be a nonempty repository-relative path under bin/: ${target}.`;
  const normalized = canonicalEntrypoint(target);
  if (!normalized) return `Entrypoint target must use a canonical path under bin/: ${target}.`;
  try {
    const segments = normalized.split("/");
    let current = root;
    for (const [index, segment] of segments.entries()) {
      current = join(current, segment);
      const metadata = await checkStat(current);
      if (metadata.isSymbolicLink())
        return `Entrypoint target path must not contain a symlink: ${target}.`;
      if (index === segments.length - 1 && !metadata.isFile())
        return `Entrypoint target must be an existing file: ${target}.`;
    }
  } catch {
    return `Entrypoint target does not exist: ${target}.`;
  }
  return null;
}

function canonicalEntrypoint(target) {
  const path = target.replaceAll("\\", "/").replace(/^\.\//u, "");
  const segments = path.split("/");
  if (
    !path.startsWith("bin/") ||
    segments.some(
      (segment) => !segment || segment === "." || segment === ".." || segment.includes(":"),
    )
  )
    return null;
  return path;
}
