/** Resolve the supported npm launcher for the current process platform. */
export function resolveNpmCommand(platform = process.platform) {
  return platform === 'win32' ? process.execPath : 'npm';
}
