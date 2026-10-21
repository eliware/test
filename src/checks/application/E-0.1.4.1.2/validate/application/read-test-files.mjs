import { join } from "node:path";

export async function readApplicationTestFiles(files, readText, root) {
  const testPaths = files.filter((path) => path.startsWith("tests/") && path.endsWith(".test.mjs"));
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
