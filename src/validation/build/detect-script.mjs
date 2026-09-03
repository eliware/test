import { configuredScript } from '../common/configured-script.mjs';

/** Return the configured consumer build script, or an empty string. */
export function detectBuildScript(cwd, readFilePath) {
  return configuredScript(cwd, 'build', readFilePath);
}
