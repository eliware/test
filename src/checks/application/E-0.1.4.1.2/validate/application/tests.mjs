import { validateMirroredTests } from "../../../../shared/layout/mirrored-tests.mjs";
import { validateExecutableTests } from "../executable-tests.mjs";
import { validateLayoutLineLimits } from "../../../../shared/layout/line-limits.mjs";
import { readApplicationTestFiles } from "./read-test-files.mjs";
import { validateTestFileLayout } from "../test-file-layout.mjs";

export async function validateApplicationTests(files, readText, root) {
  const testFiles = await readApplicationTestFiles(files, readText, root);
  return [
    ...validateTestFileLayout(files),
    ...validateMirroredTests(files),
    ...validateExecutableTests(testFiles),
    ...(await validateLayoutLineLimits(files, readText, root, testFiles)),
  ];
}
