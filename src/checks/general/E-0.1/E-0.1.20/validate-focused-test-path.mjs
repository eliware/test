import { realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { focusedPathFrom } from "./build-jest-arguments.mjs";

export async function validateFocusedTestPath(root, args = []) {
  const focusedPath = focusedPathFrom(args);
  if (!focusedPath) return null;
  const normalized = focusedPath.replaceAll("\\", "/").replace(/^\.\//, "");
  const rootPath = await realpath(root);
  let targetPath;
  try {
    targetPath = await realpath(resolve(rootPath, normalized));
  } catch {
    throw new Error(`Focused test path does not exist: ${focusedPath}`);
  }
  const relativePath = relative(rootPath, targetPath);
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new Error(`Focused test path must resolve inside the repository: ${focusedPath}`);
  }
  if (!(await stat(targetPath)).isFile()) {
    throw new Error(`Focused test path must be a regular file: ${focusedPath}`);
  }
  return focusedPath;
}
