import { runPackageScript } from './run-package-script.mjs';
export function runPack(cwd, write, options) { return runPackageScript(cwd, 'pack', write, options); }
