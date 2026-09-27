export function validatePackageScripts(packageJson) {
  const scripts = packageJson?.scripts;
  if (
    !scripts ||
    typeof scripts !== "object" ||
    Array.isArray(scripts) ||
    Object.keys(scripts).length === 0 ||
    Object.values(scripts).some((script) => typeof script !== "string" || !script.trim())
  ) {
    return "package.json.scripts must be a nonempty object of nonempty strings.";
  }
  return null;
}
