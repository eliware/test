import { join } from "node:path";
import { collectRepositoryFiles } from "./collect-repository-files.mjs";
import { collectRepositoryDirectories } from "./collect-repository-directories.mjs";

export async function readSourceTestMirrorInventory(root, repositoryInventory) {
  if (repositoryInventory) {
    const [sourceRecords, testRecords] = await Promise.all([
      repositoryInventory.entriesUnder(join(root, "src")),
      repositoryInventory.entriesUnder(join(root, "tests")),
    ]);
    return {
      sourceFiles: project(sourceRecords, "src", "file"),
      testFiles: project(testRecords, "tests", "file"),
      sourceDirectories: project(sourceRecords, "src", "directory"),
      testDirectories: project(testRecords, "tests", "directory"),
    };
  }
  const sourceFiles = await collectRepositoryFiles(join(root, "src"), join(root, "src"));
  const testFiles = await collectRepositoryFiles(join(root, "tests"), join(root, "tests"));
  const sourceDirectories = await collectRepositoryDirectories(join(root, "src"), join(root, "src"));
  const testDirectories = await collectRepositoryDirectories(join(root, "tests"), join(root, "tests"));
  return { sourceFiles, testFiles, sourceDirectories, testDirectories };
}

function project(records, rootName, type) {
  const prefix = `${rootName}/`;
  return records
    .filter((record) => record.type === type && record.path.startsWith(prefix))
    .map((record) => record.path.slice(prefix.length));
}
