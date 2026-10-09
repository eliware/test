export function collectCliEntrypoints(packageJson = {}) {
  const bin = packageJson.bin;
  const entrypoints = typeof bin === "string" ? [bin] : Object.values(bin ?? {});
  return entrypoints.filter((entrypoint) => typeof entrypoint === "string" && entrypoint.trim());
}
