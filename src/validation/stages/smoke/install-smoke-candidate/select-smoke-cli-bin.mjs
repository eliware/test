export function selectSmokeCliBin(packageJson) {
  const bin = packageJson?.bin;
  return typeof bin === "string" ? bin : Object.values(bin ?? {})[0];
}
