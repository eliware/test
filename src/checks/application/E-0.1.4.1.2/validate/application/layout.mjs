import { validateMirroredTests } from "../../../../shared/layout/mirrored-tests.mjs";
import { validateExecutableTests } from "../executable-tests.mjs";
import { validateApplicationLineLimits } from "./line-limits.mjs";
import { readApplicationTestFiles } from "./read-test-files.mjs";
import { validateTestFileLayout } from "../test-file-layout.mjs";
import { validateInternalExportBarrels } from "../../../../shared/validate-internal-export-barrels.mjs";
import { validateImplementationPlacement } from "../implementation-placement.mjs";

export async function validateApplicationLayout(context = {}) {
  const files = await context.repositoryInventory.files("all");
  const read = context.repositoryInventory.readText;
  const root = context.root ?? process.cwd();
  const testFiles = await readApplicationTestFiles(files, read, root);
  return [
    ...validateTestFileLayout(files),
    ...validateImplementationPlacement(
      files,
      context.packageJson?.eliware?.apply ?? [],
      context.packageJson,
    ),
    ...validateMirroredTests(files),
    ...validateExecutableTests(testFiles),
    ...(await validateApplicationLineLimits(files, read, root, testFiles)),
    ...(await validateInternalExportBarrels(files, read, context.packageJson ?? {}, root)),
  ];
}
