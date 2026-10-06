export function validateEntrypointMetadata(packageJson) {
  const errors = [];
  const bin = packageJson.bin;
  const targets = [
    packageJson.main,
    ...(typeof bin === "string" ? [bin] : Object.values(bin ?? {})),
  ];
  if (!targets.some((target) => typeof target === "string" && target.trim()))
    errors.push("package.json must declare at least one runtime entrypoint through main or bin.");
  if (
    bin !== undefined &&
    typeof bin !== "string" &&
    (!bin || typeof bin !== "object" || Array.isArray(bin))
  )
    errors.push("package.json bin must be a path or a command map.");
  for (const name of Object.keys(bin && typeof bin === "object" ? bin : {}))
    if (!/^[A-Za-z0-9_.-]+$/u.test(name))
      errors.push(`package.json bin command name is invalid: ${name}.`);
  return errors;
}
