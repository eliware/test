import { spawn as defaultSpawn } from 'node:child_process';
import { childEnvironment } from './environment/child-environment.mjs';

/** Spawn a child with the package's trusted workspace-process defaults. */
export function spawnChild(command, argumentsList, options = {}) {
  return (options.spawn ?? defaultSpawn)(command, argumentsList, {
    cwd: options.cwd,
    // codescope ignore: child tools intentionally receive the full trusted consumer environment; secret isolation is outside this package contract.
    env: childEnvironment(options),
    windowsHide: true
  });
}
