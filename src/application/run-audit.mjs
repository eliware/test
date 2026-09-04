import { runPackageScript } from './run-package-script.mjs';
export function runAudit(cwd, write, options) { return runPackageScript(cwd, 'audit', write, options); }
