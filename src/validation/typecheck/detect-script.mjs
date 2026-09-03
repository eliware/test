import { configuredScript } from '../common/configured-script.mjs';

/** Return the configured consumer typecheck script, or an empty string. */
export function detectTypecheckScript(cwd, readFilePath) {
  return configuredScript(cwd, 'typecheck', readFilePath);
}
