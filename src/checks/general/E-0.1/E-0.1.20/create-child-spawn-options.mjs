export function createChildSpawnOptions(options, environment) {
  return {
    cwd: options.cwd,
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    detached: (options.terminationPlatform ?? process.platform) !== "win32",
  };
}
