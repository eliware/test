import { validateLayoutLineLimits } from "../../../shared/layout/line-limits.mjs";
import { validateMirroredTests } from "../../../shared/layout/mirrored-tests.mjs";
import { validateTestFileLayout } from "../../../application/E-0.1.4.1.2/validate/test-file-layout.mjs";
import { validateLibrarySourcePlacement } from "./source-placement.mjs";
import { readApplicationTestFiles } from "../../../application/E-0.1.4.1.2/validate/application/read-test-files.mjs";

export async function validateLibraryLayout(context) {
  const inventory = context.repositoryInventory;
  if (!inventory) return ["Repository inventory is required for library layout checks."];
  const files = await inventory.files("all");
  const read = inventory.readText;
  const root = context.root ?? process.cwd();
  const testFiles = await readApplicationTestFiles(files, read, root);
  const errors = validateLibrarySourcePlacement(files);
  errors.push(...validateTestFileLayout(files));
  errors.push(...validateMirroredTests(files));
  errors.push(...(await validateLayoutLineLimits(files, read, root, testFiles)));
  return errors;
}
