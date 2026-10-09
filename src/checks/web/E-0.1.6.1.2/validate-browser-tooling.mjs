export function validateBrowserTooling(packageJson = {}) {
  const errors = [];
  const dependencySections = [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ];
  for (const name of ["lighthouse", "puppeteer"]) {
    if (
      !dependencySections.some((section) => {
        const value = packageJson[section]?.[name];
        return typeof value === "string" && Boolean(value.trim());
      })
    )
      errors.push(`Web applications must directly declare ${name}.`);
    if (typeof packageJson.scripts?.[name] !== "string" || !packageJson.scripts[name].trim())
      errors.push(`Web applications must define a nonempty ${name} script.`);
  }
  return errors;
}
