import { validateMirroredTests } from "./validate-mirrored-tests.mjs";
import { validateApplicationLineLimits } from "./validate-application-line-limits.mjs";
import { validateTestFileLayout } from "./validate-test-file-layout.mjs";
import { validateInternalExportBarrels } from "./validate-internal-export-barrels.mjs";
import { validateImplementationPlacement } from "./validate-implementation-placement.mjs";

export async function validateApplicationLayout(context = {}) {
  const files = await context.repositoryInventory.files("all");
  const read = context.repositoryInventory.readText;
  const root = context.root ?? process.cwd();
  return [
    ...validateTestFileLayout(files),
    ...validateImplementationPlacement(files),
    ...(await validateMirroredTests(files, read, root)),
    ...(await validateApplicationLineLimits(files, read, root)),
    ...(await validateInternalExportBarrels(files, read, context.packageJson ?? {}, root)),
  ];
}
