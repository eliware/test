export function validateEntrypointMetadata(packageJson) {
  const errors = [];
  const bin = packageJson.bin;
  const targets = [
    packageJson.main,
    ...(typeof bin === "string" ? [bin] : Object.values(bin ?? {})),
  ];
  if (!targets.some((target) => typeof target === "string" && target.trim()))
    errors.push("package.json must declare at least one runtime entrypoint through main or bin.");
  if (packageJson.main !== undefined && !validTarget(packageJson.main))
    errors.push("package.json main must be a nonempty path string.");
  if (
    bin !== undefined &&
    typeof bin !== "string" &&
    (!bin || typeof bin !== "object" || Array.isArray(bin))
  )
    errors.push("package.json bin must be a path or a command map.");
  if (typeof bin === "string" && !validTarget(bin))
    errors.push("package.json bin must be a nonempty path string.");
  for (const name of Object.keys(bin && typeof bin === "object" ? bin : {}))
    if (!/^[A-Za-z0-9_.-]+$/u.test(name))
      errors.push(`package.json bin command name is invalid: ${name}.`);
  if (bin && typeof bin === "object")
    for (const [name, target] of Object.entries(bin))
      if (!validTarget(target))
        errors.push(`package.json bin target for ${name} must be a nonempty path string.`);
  return errors;
}

function validTarget(value) {
  return typeof value === "string" && Boolean(value.trim());
}
