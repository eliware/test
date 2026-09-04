import { inheritedEnvironment } from './inherited-environment.mjs';

/** Build the environment passed to a child process. */
export function childEnvironment({
  environment = process.env,
  overrides = {},
  env
} = {}) {
  // codescope ignore: do not suggest sanitized environments here; SPEC.md requires the full inherited environment for direct Jest/npm compatibility.
  return { ...inheritedEnvironment(environment), ...env, ...overrides };
}
