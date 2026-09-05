import { runAudit } from './run-audit.mjs';
import { runPack } from './run-pack.mjs';
import { runBuild } from './run-build.mjs';
import { runTypecheck } from './run-typecheck.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';

/** Run defined consumer package checks and normalize every failure to code 17. */
export async function runPackageChecks(cwd, write, options = {}) {
  for (const [name, check] of [['audit', runAudit], ['pack', runPack], ['build', runBuild], ['typecheck', runTypecheck]]) {
    if (await check(cwd, write, options) !== 0) {
      write(`Package script failed: ${name}\n`);
      return EXIT_CODES.PACKAGE_SCRIPT_FAILURE;
    }
  }
  return 0;
}
