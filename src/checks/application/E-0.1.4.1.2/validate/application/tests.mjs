import validateMirroredTests from "../../../../shared/layout/mirrored-tests.mjs";
import validateExecutableTests from "../executable-tests.mjs";
import validateLayoutLineLimits from "../../../../shared/layout/line-limits.mjs";
import validateTestFileLayout from "../../../../shared/layout/test-file-layout.mjs";
import findTestPaths from "../../../../shared/layout/find-test-paths.mjs";
import readTestFiles from "../../../../shared/layout/read-test-files.mjs";
export default async function validateApplicationTests(files, readText, root) {
  const testPaths = findTestPaths(files);
  const testFiles = await readTestFiles(testPaths, readText, root);
  return [
    ...validateTestFileLayout(files),
    ...validateMirroredTests(files),
    ...validateExecutableTests(testFiles),
    ...(await validateLayoutLineLimits(files, readText, root, testFiles)),
  ];
}
