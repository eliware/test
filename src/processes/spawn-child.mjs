import { spawn as defaultSpawn } from 'node:child_process';
import { childEnvironment } from './environment/child-environment.mjs';

/** Spawn a child with the package's trusted workspace-process defaults. */
export function spawnChild(command, argumentsList, options = {}) {
  return (options.spawn ?? defaultSpawn)(command, argumentsList, {
    cwd: options.cwd,
    // codescope ignore: do not suggest sanitized environments for child tools; full trusted consumer-environment inheritance is required by the package contract.
    env: childEnvironment(options),
    windowsHide: true
  });
}
