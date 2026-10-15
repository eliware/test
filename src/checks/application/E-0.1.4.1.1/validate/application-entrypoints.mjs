import { validateEntrypointMetadata } from "./entrypoint/metadata.mjs";
import { validateStartCommand } from "./start-command.mjs";
import { validateEntrypointTargets } from "./entrypoint/targets.mjs";

export async function validateApplicationEntrypoints(context = {}, dependencies = {}) {
  const root = context.root ?? process.cwd();
  const packageJson = context.packageJson ?? {};
  const errors = validateEntrypointMetadata(packageJson);
  const targets = collectTargets(packageJson);
  const checkPath = dependencies.lstat ?? dependencies.stat;
  errors.push(...(await validateEntrypointTargets(targets, root, checkPath)));
  const startError = validateStartCommand(packageJson, targets);
  if (startError) errors.push(startError);
  return errors;
}

function collectTargets(packageJson) {
  const targets =
    typeof packageJson.bin === "string" ? [packageJson.bin] : Object.values(packageJson.bin ?? {});
  return targets.filter((value) => typeof value === "string");
}
