import { validateProductionCoveragePolicy } from "../../production-coverage-policy.mjs";
import { validateTestToolReferences } from "../../test-tool-references.mjs";
import { isPureExportBarrel } from "../../../../../shared/is/pure-export-barrel.mjs";

export function validateJestSourceFilePolicy(path, content, options = {}) {
  const errors = [];
  const toolError = validateTestToolReferences(path, content, options.harness);
  const coverageError = validateProductionCoveragePolicy(path, content, {
    allowLibraryBarrel: options.allowLibraryBarrel,
    pureExportBarrel: isPureExportBarrel(content),
  });
  if (toolError) errors.push(toolError);
  if (coverageError) errors.push(coverageError);
  return errors;
}
