import { EXIT_CODES } from '../../exit-codes/codes.mjs';
import { findSourceTestMappingDrifts } from '../../architecture/validate-source-test-mapping.mjs';
import { formatMappingDrifts } from '../../architecture/format-mapping-drifts.mjs';

/** Enforce the repository's one-to-one source/test module mapping. */
export async function validateArchitecture(cwd, write, findMapping = findSourceTestMappingDrifts) {
  try {
    const drifts = await findMapping(cwd);
    if (!drifts || !Array.isArray(drifts.missingTests) || !Array.isArray(drifts.orphanTests)
      || new Set([...drifts.missingTests, ...drifts.orphanTests]).size !== drifts.missingTests.length + drifts.orphanTests.length
      || [...drifts.missingTests, ...drifts.orphanTests].some((entry) => typeof entry !== 'string' || entry.length === 0)) {
      throw new TypeError('mapping collaborator returned an invalid result');
    }
    if (drifts.missingTests.length || drifts.orphanTests.length) {
      write(formatMappingDrifts(drifts));
      return EXIT_CODES.ARCHITECTURE_MAPPING;
    }
    return 0;
  } catch (error) {
    write(`Architecture mapping validation failed: ${error.message}\n`);
    return EXIT_CODES.WORKSPACE_SETUP;
  }
}
