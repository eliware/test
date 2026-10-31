import { join } from "node:path";

export async function readApplicationTestFiles(testPaths, readText, root) {
  return Promise.all(
    testPaths.map(async (path) => {
      try {
        return { path, content: await readText(join(root, path)), readError: false };
      } catch {
        return { path, content: "", readError: true };
      }
    }),
  );
}
