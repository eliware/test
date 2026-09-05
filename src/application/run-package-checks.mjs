import { runAudit } from './run-audit.mjs';
import { runPack } from './run-pack.mjs';
import { runBuild } from './run-build.mjs';
import { runTypecheck } from './run-typecheck.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';

/** Run defined consumer package checks and normalize every failure to code 17. */
export async function runPackageChecks(cwd, write, options = {}) {
  const checks = options.checks ?? [['audit', runAudit], ['pack', runPack], ['build', runBuild], ['typecheck', runTypecheck]];
  for (const [name, check] of checks) {
    let result;
    try { result = await check(cwd, write, options); }
    catch (error) {
      write(`Package script failed: ${name}${error?.message ? `: ${error.message}` : ''}\n`);
      return EXIT_CODES.PACKAGE_SCRIPT_FAILURE;
    }
    const code = Number.isInteger(result) && result >= 0 ? result : 1;
    if (code !== 0) {
      write(`Package script failed: ${name}\n`);
      return EXIT_CODES.PACKAGE_SCRIPT_FAILURE;
    }
  }
  return 0;
}
