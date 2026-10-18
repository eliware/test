export function collectEntrypointTargets(packageJson) {
  const targets =
    typeof packageJson.bin === "string" ? [packageJson.bin] : Object.values(packageJson.bin ?? {});
  return targets.filter((value) => typeof value === "string");
}
