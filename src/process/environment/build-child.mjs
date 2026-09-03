import { inheritedEnvironment } from './inherited.mjs';
import { childEnvironment } from './sanitized.mjs';

export function buildChildOptions(options) {
  return { cwd: options.cwd, env: childEnvironment(options, inheritedEnvironment), windowsHide: true };
}
