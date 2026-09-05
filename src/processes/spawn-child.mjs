import { spawn as defaultSpawn } from 'node:child_process';
import { childEnvironment } from './environment/child-environment.mjs';

/** Spawn a child with the package's trusted workspace-process defaults. */
export function spawnChild(command, argumentsList, options = {}) {
  return (options.spawn ?? defaultSpawn)(command, argumentsList, {
    cwd: options.cwd,
    env: childEnvironment(options),
    windowsHide: true,
    shell: false,
    detached: process.platform !== 'win32'
  });
}
