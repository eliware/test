import { validateMirroredTests } from "../mirrored-tests.mjs";
import { validateApplicationLineLimits } from "./line-limits.mjs";
import { validateTestFileLayout } from "../test-file-layout.mjs";
import { validateInternalExportBarrels } from "../internal-export-barrels.mjs";
import { validateImplementationPlacement } from "../implementation-placement.mjs";

export async function validateApplicationLayout(context = {}) {
  const files = await context.repositoryInventory.files("all");
  const read = context.repositoryInventory.readText;
  const root = context.root ?? process.cwd();
  return [
    ...validateTestFileLayout(files),
    ...validateImplementationPlacement(
      files,
      context.packageJson?.eliware?.apply ?? [],
      context.packageJson,
    ),
    ...(await validateMirroredTests(files, read, root)),
    ...(await validateApplicationLineLimits(files, read, root)),
    ...(await validateInternalExportBarrels(files, read, context.packageJson ?? {}, root)),
  ];
}
