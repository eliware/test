import { runPackageScript } from './run-package-script.mjs';
export function runTypecheck(cwd, write, options) { return runPackageScript(cwd, 'typecheck', write, options); }
