import { stat } from "node:fs/promises";
import { isAbsolute, join, normalize, relative, sep } from "node:path";
import { validateEntrypointMetadata } from "./validate-entrypoint-metadata.mjs";
import { validateStartCommand } from "./validate-start-command.mjs";

export async function validateApplicationEntrypoints(context = {}, dependencies = {}) {
  const root = context.root ?? process.cwd();
  const packageJson = context.packageJson ?? {};
  const errors = validateEntrypointMetadata(packageJson);
  const targets = collectTargets(packageJson);
  for (const target of targets) {
    const error = await validateEntrypointTarget(target, root, dependencies.stat ?? stat);
    if (error) errors.push(error);
  }
  const startError = validateStartCommand(packageJson, targets);
  if (startError) errors.push(startError);
  return errors;
}

function collectTargets(packageJson) {
  return [
    packageJson.main,
    ...(typeof packageJson.bin === "string"
      ? [packageJson.bin]
      : Object.values(packageJson.bin ?? {})),
  ].filter((value) => typeof value === "string");
}

async function validateEntrypointTarget(target, root, checkStat) {
  if (typeof target !== "string" || !target.trim() || isAbsolute(target))
    return `Entrypoint target must be a nonempty repository-relative path under bin/: ${target}.`;
  const normalized = normalize(target.replaceAll("\\", "/")).replaceAll("\\", "/");
  const resolved = join(root, normalized);
  const relativeTarget = relative(root, resolved);
  if (
    !normalized.startsWith("bin/") ||
    relativeTarget.startsWith(`..${sep}`) ||
    relativeTarget === ".."
  )
    return `Entrypoint target must stay under bin/: ${target}.`;
  try {
    if (!(await checkStat(resolved)).isFile())
      return `Entrypoint target must be an existing file: ${target}.`;
  } catch {
    return `Entrypoint target does not exist: ${target}.`;
  }
  return null;
}
