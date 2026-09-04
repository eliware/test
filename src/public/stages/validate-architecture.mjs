import { EXIT_CODES } from '../../exit-codes/codes.mjs';
import { findSourceTestMappingDrifts } from '../../architecture/validate-source-test-mapping.mjs';
import { formatMappingDrifts } from '../../architecture/format-mapping-drifts.mjs';

/** Enforce the repository's one-to-one source/test module mapping. */
export async function validateArchitecture(cwd, write, findMapping = findSourceTestMappingDrifts) {
  try {
    const drifts = await findMapping(cwd);
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
