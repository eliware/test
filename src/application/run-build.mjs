import { runPackageScript } from './run-package-script.mjs';
export function runBuild(cwd, write, options) { return runPackageScript(cwd, 'build', write, options); }
