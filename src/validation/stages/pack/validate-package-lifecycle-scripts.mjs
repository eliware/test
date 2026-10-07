const prohibitedHooks = ["prepublish", "prepare", "prepack", "postpack", "prepublishOnly"];

export function validatePackageLifecycleScripts(packageJson) {
  const scripts = packageJson?.scripts;
  if (!scripts || typeof scripts !== "object" || Array.isArray(scripts)) return null;
  const prohibited = prohibitedHooks.filter((hook) => Object.hasOwn(scripts, hook));
  return prohibited.length
    ? `Public npm packages must not define packaging lifecycle scripts: ${prohibited.join(", ")}.`
    : null;
}
