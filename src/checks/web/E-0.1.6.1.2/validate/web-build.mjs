const expectedBuildCommand =
  "webpack --entry ./src/client-entry.mjs --output-path ./dist --output-filename client.js --mode production";

export function validateWebBuild(packageJson = {}) {
  const errors = [];
  const dependencySections = [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ];
  const hasWebpack = dependencySections.some((section) => {
    const value = packageJson[section]?.webpack;
    return typeof value === "string" && Boolean(value.trim());
  });

  if (!hasWebpack) errors.push("Web applications must directly declare webpack.");
  if (typeof packageJson.scripts?.build !== "string") {
    errors.push("Web applications must define the standard webpack build script.");
  } else if (packageJson.scripts.build.trim() !== expectedBuildCommand) {
    errors.push("Web applications must use the standard webpack build command.");
  }

  return errors;
}
