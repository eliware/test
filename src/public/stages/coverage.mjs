import { readCoverage } from '../../coverage/read-coverage.mjs';
import { formatGaps } from '../../coverage/format-gaps.mjs';
import { EXIT_CODES } from '../../exit-codes/codes.mjs';
export async function validateCoverage(cwd, output, write, readFilePath, statPath, startedAt) {
  try { const gaps = await readCoverage(cwd, output, write, readFilePath, statPath, startedAt); if (gaps.length) { write(formatGaps(gaps, cwd)); return EXIT_CODES.COVERAGE_GAP; } return 0; }
  catch (error) { write(`Coverage validation failed: ${error.message}\n`); return EXIT_CODES.COVERAGE_FAILURE; }
}
