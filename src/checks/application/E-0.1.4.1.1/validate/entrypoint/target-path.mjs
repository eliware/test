import { inspectEntrypointTarget } from "./canonical-target.mjs";

export function validateEntrypointTargetPath(target) {
  const inspection = inspectEntrypointTarget(target);
  if (inspection.error === "relative")
    return {
      error: `Entrypoint target must be a nonempty repository-relative path under bin/: ${target}.`,
    };
  if (inspection.error)
    return { error: `Entrypoint target must use a canonical path under bin/: ${target}.` };
  return { path: inspection.path, error: null };
}
