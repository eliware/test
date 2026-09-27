import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readSourceTestContents(root, testFiles, repositoryInventory) {
  const testCases = testFiles.filter((file) => file.endsWith(".test.mjs"));
  const contents = new Map();
  for (const file of testCases) {
    const path = join(root, "tests", file);
    contents.set(
      file,
      repositoryInventory ? await repositoryInventory.readText(path) : await readFile(path, "utf8"),
    );
  }
  return contents;
}
