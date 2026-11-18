import validateLayoutLineLimits from "../../../shared/layout/line-limits.mjs";
import validateMirroredTests from "../../../shared/layout/mirrored-tests.mjs";
import validateTestFileLayout from "../../../shared/layout/test-file-layout.mjs";
import validateLibrarySourcePlacement from "./source-placement.mjs";
import findTestPaths from "../../../shared/layout/find-test-paths.mjs";
import readTestFiles from "../../../shared/layout/read-test-files.mjs";
export default async function validateLibraryLayout(context) {
  const inventory = context.repositoryInventory;
  if (!inventory) return ["Repository inventory is required for library layout checks."];
  const files = await inventory.files("all");
  const read = inventory.readText;
  const root = context.root ?? process.cwd();
  const testPaths = findTestPaths(files);
  const testFiles = await readTestFiles(testPaths, read, root);
  const errors = validateLibrarySourcePlacement(files);
  errors.push(...validateTestFileLayout(files));
  errors.push(...validateMirroredTests(files));
  errors.push(...(await validateLayoutLineLimits(files, read, root, testFiles)));
  return errors;
}
